import base64
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from os import getenv
from cv2 import VideoWriter, imdecode, IMREAD_COLOR
from numpy import frombuffer, uint8, mean
from threading import Thread
from time import time


from asyncio import Queue, QueueEmpty, get_event_loop, create_task, wait_for, TimeoutError



load_dotenv()

# Configuration
UPLOAD_FOLDER = getenv("UPLOAD_FOLDER", "recordings")
UPLOAD_FOLDER_PATH = Path(UPLOAD_FOLDER)
UPLOAD_FOLDER_PATH.mkdir(exist_ok=True)


class AsyncVideoRecorder:
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
        self.writer_task = None
        self.last_ack_frame = 0

        self.start_time = time()
        self.decode_times = []
        

    async def setup_video_writer(self, width, height, fps=24):
        """Initialize video writer"""
        self.fps = fps
        self.frame_size = (width, height)

        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")

        self.output_path = Path.joinpath(UPLOAD_FOLDER_PATH, f"video_{timestamp}.mp4")

        loop = get_event_loop()

        def create_writer():
            fourcc = VideoWriter.fourcc(*"mp4v")
            writer = VideoWriter(
                self.output_path, fourcc, self.fps, self.frame_size
            )

            print(f"Video writer initialized: {self.output_path}")
            return writer
        
        self.video_writer = await loop.run_in_executor(None, create_writer)
        print(f"Video writer init: {self.output_path}")
        
        return self.output_path

    async def start_writer_task(self):
        """Start async task for writing frames"""
        self.writer_task = create_task(self._write_frames_worker())
       
        print(f"Writer thread started for session {self.session_id}")

    async def _write_frames_worker(self):
        loop = get_event_loop()
        """Background worker that writes frames from queue"""
        while self.is_recording or not self.frame_queue.empty():
            try:
                frame = await wait_for(self.frame_queue.get(), timeout=1)

                if frame is None:  # Added manually to end thread
                    break
                if self.video_writer and self.video_writer.isOpened():
                    await loop.run_in_executor(None, self.video_writer.write, frame)

                    self.frame_count += 1

                self.frame_queue.task_done()
            except (QueueEmpty, TimeoutError):
                continue
            except Exception as e:
                print(f"Error in writer thread: {e}")

            print(f"Writer thread finished. Frames written: {self.frame_count}")

    async def add_frame(self, frame_data):
        """Add a frame to the video"""
        try:
            decode_start = time()

            loop = get_event_loop()

            def decode_frame():
                # Decode: base64 to image
                img_bytes = base64.b64decode(frame_data)
                nparr = frombuffer(img_bytes, uint8)
                frame = imdecode(nparr, IMREAD_COLOR)

            frame = await loop.run_in_executor(None, decode_frame)

            decode_time = time() - decode_start
            self.decode_times.append(decode_time)

            if frame is None:
                print("Failed to decode frame")
                return False

            # Initialize video writer on first frame
            if self.video_writer is None:
                height, width = frame.shape[:2]
                await self.setup_video_writer(width, height, self.fps)
                await self.start_writer_task()

            if not self.frame_queue.full():
                # Write frame to video
                self.frame_queue.put(frame)
                return True
            else:
                print(f"Warning: Frame queue full, dropping frame")
                return False

        except Exception as e:
            print(f"Error adding frame: {e}")
            return False

    def save_as_images(self, frame_data):
        """Alternative: Save frames as individual images"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            folder_path = Path.joinpath(UPLOAD_FOLDER_PATH, f"frames_{timestamp}")
            Path(folder_path).mkdir(exist_ok=True)

            img_bytes = base64.b64decode(frame_data)
            frame_path = Path.joinpath(
                Path(folder_path), f"frame_{self.frame_count:06d}.jpg"
            )

            with open(frame_path, "wb") as f:
                f.write(img_bytes)

            self.frame_count += 1
            return True
        except Exception as e:
            print(f"Error saving image: {e}")
            return False

    async def finalize(self):
        """Finalize and close the video file"""
        print(f"Finalizing video for session {self.session_id}")
        self.is_recording = False

        if self.frame_queue:
            print(f"Waiting for {self.frame_queue.qsize()} frames to be written...")
            await self.frame_queue.join()

        if self.writer_task and not self.writer_task.done():
            await self.frame_queue.put(None)  # null byte

            try:
                await wait_for(self.writer_task, timeout=5)
        

            except TimeoutError:
                print("Writer task timeout, cancelling...")
                self.writer_task.cancel()

        if self.video_writer:
            loop = get_event_loop()

            await loop.run_in_executor(None, self.video_writer.release)

            # Stats
            elapsed = time() - self.start_time
            avg_decode = mean(self.decode_times) * 1000 if self.decode_times else 0

            print(
                f"Video saved: {self.output_path} ({self.frame_count} frames). Duration: {elapsed:.2f}s"
            )
            print(f"Avg decode time: {avg_decode:.2f}ms")
            return self.output_path
        return None