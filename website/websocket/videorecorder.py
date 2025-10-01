import base64
from pathlib import Path
from datetime import datetime
from array import array
from dotenv import load_dotenv
from os import getenv
from cv2 import VideoWriter, imdecode, IMREAD_COLOR
from numpy import frombuffer, uint8

load_dotenv()

# Configuration
UPLOAD_FOLDER = getenv("UPLOAD_FOLDER", "recordings")
UPLOAD_FOLDER_PATH = Path(UPLOAD_FOLDER)
UPLOAD_FOLDER_PATH.mkdir(exist_ok=True)


class VideoRecorder:
    """Handles video recording for a single session"""

    def __init__(self, session_id):
        self.session_id = session_id
        self.frames = []
        self.video_writer = None
        self.fps = 24
        self.frame_size = None
        self.output_path = None
        self.frame_count = 0

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

    def add_frame(self, frame_data):
        """Add a frame to the video"""
        try:
            # Decode base64 to image
            img_bytes = base64.b64decode(frame_data)
            # nparr = array("B").frombytes(img_bytes)
            nparr = frombuffer(img_bytes, uint8)

            frame = imdecode(nparr, IMREAD_COLOR)

            if frame is None:
                print("Failed to decode frame")
                return False

            # Initialize video writer on first frame
            if self.video_writer is None:
                height, width = frame.shape[:2]
                self.setup_video_writer(width, height, self.fps)

            # Write frame to video
            self.video_writer.write(frame)
            self.frame_count += 1

            return True
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

    def finalize(self):
        """Finalize and close the video file"""
        if self.video_writer:
            self.video_writer.release()
            print(f"Video saved: {self.output_path} ({self.frame_count} frames)")
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
            img_bytes = base64.b64decode(frame_data)
            nparr = frombuffer(img_bytes, uint8)
            # nparr = array("B").frombytes(img_bytes)
            frame = imdecode(nparr, IMREAD_COLOR)

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
