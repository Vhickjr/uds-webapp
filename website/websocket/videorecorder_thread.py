import base64
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from os import getenv
from cv2 import VideoWriter, imdecode, IMREAD_COLOR
from numpy import frombuffer, uint8, mean
from threading import Thread
from queue import Queue, Empty
from time import time


load_dotenv()

# Configuration
UPLOAD_FOLDER = getenv("UPLOAD_FOLDER", "recordings")
UPLOAD_FOLDER_PATH = Path(UPLOAD_FOLDER)
UPLOAD_FOLDER_PATH.mkdir(exist_ok=True)


class ThreadVideoRecorder:
    """Handles video recording for a single session"""

    def __init__(self, session_id):
        self.session_id = session_id
        self.frame_queue = Queue(maxsize=100)
        self.video_writer = None
        self.fps = 24
        self.frame_size = None
        self.output_path = None
        self.frame_count = 0

        self.is_recording = True
        self.writer_thread = None

        self.start_time = time()
        self.decode_times = []

    def setup_video_writer(self, width, height, fps=24):
        """Initialize video writer"""
        self.fps = fps
        self.frame_size = (width, height)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        self.output_path = Path.joinpath(UPLOAD_FOLDER_PATH, f"video_{timestamp}.mp4")

        # Use H264 codec for better compression
        fourcc = VideoWriter.fourcc(*"mp4v")
        self.video_writer = VideoWriter(
            self.output_path, fourcc, self.fps, self.frame_size
        )

        print(f"Video writer initialized: {self.output_path}")
        return self.output_path

    def start_writer_thread(self):
        """Start backgrounf thread for writing frames"""
        self.writer_thread = Thread(target=self._write_frames_worker, daemon=True)
        self.writer_thread.start()
        print(f"Writer thread started for session {self.session_id}")

    def _write_frames_worker(self):
        """Background worker that writes frames from queue"""
        while self.is_recording or not self.frame_queue.empty():
            try:
                frame = self.frame_queue.get(timeout=1)

                if frame is None:  # Added manually to end thread
                    break
                if self.video_writer and self.video_writer.isOpened():
                    self.video_writer.write(frame)
                    self.frame_count += 1

                self.frame_queue.task_done()
            except Empty:
                continue
            except Exception as e:
                print(f"Error in writer thread: {e}")

            print(f"Writer thread finished. Frames written: {self.frame_count}")

    def add_frame(self, frame_data):
        """Add a frame to the video"""
        try:
            decode_start = time()

            # Decode: base64 to image
            img_bytes = base64.b64decode(frame_data)
            nparr = frombuffer(img_bytes, uint8)
            frame = imdecode(nparr, IMREAD_COLOR)

            decode_time = time() - decode_start
            self.decode_times.append(decode_time)

            if frame is None:
                print("Failed to decode frame")
                return False

            # Initialize video writer on first frame
            if self.video_writer is None:
                height, width = frame.shape[:2]
                self.setup_video_writer(width, height, self.fps)
                self.start_writer_thread()

            if not self.frame_queue.full():
                # Write frame to video
                self.frame_queue.put(frame, block=False)
                return True
            else:
                print(f"Warning: Frame queue full, dropping frame")
                return False

        except Exception as e:
            print(f"Error adding frame: {e}")
            return False
        

    def finalize(self):
        """Finalize and close the video file"""
        print(f"Finalizing video for session {self.session_id}")
        self.is_recording = False

        if not self.frame_queue.empty():
            print(f"Waiting for {self.frame_queue.qsize()} frames to be written...")
            self.frame_queue.join()

        if self.writer_thread and self.writer_thread.is_alive():
            self.frame_queue.put(None)  # null byte
            self.writer_thread.join(timeout=5)

        if self.video_writer:
            self.video_writer.release()

            # Stats
            elapsed = time() - self.start_time
            avg_decode = mean(self.decode_times) * 1000 if self.decode_times else 0

            print(
                f"Video saved: {self.output_path} ({self.frame_count} frames). Duration: {elapsed:.2f}s"
            )
            print(f"Avg decode time: {avg_decode:.2f}ms")
            return self.output_path
        return None


# ALTERNATIVE: Store frames in memory and save later
class BufferedVideoRecorder:
    """Store frames in memory, then save as video file"""

    def __init__(self, session_id):
        self.session_id = session_id
        self.frames = []
        self.fps = 24
        self.max_frames = 1000  # Limit memory usage
        self.frame_count = 0

    def add_frame(self, frame_data):
        """Buffer frame in memory"""
        try:
            decode_start = time()

            img_bytes = base64.b64decode(frame_data)
            nparr = frombuffer(img_bytes, uint8)
            # nparr = array("B").frombytes(img_bytes)
            frame = imdecode(nparr, IMREAD_COLOR)

            decode_time = time() - decode_start
            self.decode_times.append(decode_time)

            if frame is not None:
                self.frames.append(frame)
                self.frame_count += 1

                # Prevent memory overflow
                if len(self.frames) > self.max_frames:
                    self.frames.pop(0)

                return True
        except Exception as e:
            print(f"Error buffering frame: {e}")
        return False

    def finalize(self):
        """Save buffered frames to video file"""
        if not self.frames:
            return None

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        output_path = Path.joinpath(
            UPLOAD_FOLDER_PATH, f"buffered_video_{timestamp}.mp4"
        )

        height, width = self.frames[0].shape[:2]
        fourcc = VideoWriter.fourcc(*"mp4v")
        video_writer = VideoWriter(output_path, fourcc, self.fps, (width, height))

        for frame in self.frames:
            video_writer.write(frame)

        video_writer.release()
        print(f"Buffered video saved: {output_path} ({len(self.frames)} frames)")
        return output_path
