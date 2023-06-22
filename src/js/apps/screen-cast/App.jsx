import { useState } from 'react';
import { useVideoRecorder } from '../../lib/media-recorder-rtc/use-video-recorder';
import { useScreenRecorder } from '../../lib/media-recorder-rtc/use-screen-recorder';

function App() {

  const [ isStreamingVideo, setIsStreamingVideo ] = useState( false );

  // Video Recorder
  const {
		isRecording: isVideoRecording,
		recordedTimeInSecond: recordedVideoTimeInSecond,
		recordedURL: recordedVideoURL,
    videoStreamRef,
		hasPermission: hasVideoRecordPermission,
		requestPermission: requestVideoRecordPermission,
		setupStream: setupVideoStream,
		startRecording: startVideoRecording,
		stopRecording: stopVideoRecording,
    getRecordedTimeAsClock: getRecordedVideoTimeAsClock,
		reset: resetVideoRecorder,
  } = useVideoRecorder();
  
  // Screen Recorder
  const {
		isRecording: isScreenRecording,
		recordedTimeInSecond: recordedScreenTimeInSecond,
		recordedBlob: recordedScreenBlob,
		recordedURL: recordedScreenURL,
    videoStreamRef: screenVideoStreamRef,
		hasPermission: hasScreenRecordPermission,
		requestPermission: requestScreenRecordPermission,
		setupStream: setupScreenStream,
		startRecording: startScreenRecording,
		stopRecording: stopScreenRecording,
		getCountDown: getScreenRecordingCountDown,
    getRecordedTimeAsClock: getRecordedScreenTimeAsClock,
		reset: resetScreenRecorder,
  } = useScreenRecorder();

  // -------------------------------------
  // Video Recording Utilities
  // -------------------------------------

  async function previewVideoStream() {
    if ( ! await maybeHasVideoRecordPermission() ) {
      console.error( 'Please grant the required permission' );
      return;
    }

    resetRecorders();
    await setupVideoStream();
    setIsStreamingVideo( true );
  }

  async function startOrStopVideoRecord() {
    if ( isVideoRecording ) {
      stopVideoRecording();
      setIsStreamingVideo( false );
      return;
    }

    await startVideoRecording();
  }

  async function maybeHasVideoRecordPermission() {
    if ( await hasVideoRecordPermission() ) {
      return true;
    }

    return await requestVideoRecordPermission();
  }

  // -------------------------------------
  // Screen Recording Utilities
  // -------------------------------------
  async function startOrStopScreenRecord() {
    if ( ! await maybeHasScreenRecordPermission() ) {
      console.error( 'Please grant the required permission' );
      return;
    }

    if ( isScreenRecording ) {
      stopScreenRecording();
      return;
    }

    resetRecorders();
    await setupScreenStream();
    await startScreenRecording();
  }

  async function maybeHasScreenRecordPermission() {
    if ( await hasScreenRecordPermission() ) {
      return true;
    }

    return await requestScreenRecordPermission();
  }

  // -------------------------------------
  // Recording Utilities
  // -------------------------------------
  function resetRecorders() {
    resetVideoRecorder();
    resetScreenRecorder();
  }

  return (
    <div className='box-container'>
      <div className="video-container">
        <div className="video-wrap">
          <video style={{display: isStreamingVideo ? 'block' : 'none'}} ref={videoStreamRef} muted></video>
          <video style={{display: isScreenRecording ? 'block' : 'none'}} ref={screenVideoStreamRef} muted></video>
          { recordedVideoURL.length ? <video src={recordedVideoURL} controls></video> : '' }
          { recordedScreenURL.length ? <video src={recordedScreenURL} controls></video> : '' }
        </div>
      </div>

      <div className="actions">
        { 
          ( ! isScreenRecording && ! isVideoRecording && ! isStreamingVideo ) &&  
          <button className='btn' onClick={previewVideoStream}>
            Preview Video Recording
          </button>
        }

        { 
          ( ! isScreenRecording && ! isVideoRecording && isStreamingVideo ) &&  
          <button className='btn' onClick={startOrStopVideoRecord}>
            Start Video Recording
          </button>
        }

        { 
          ( isVideoRecording ) &&  
          <button className='btn btn-danger' onClick={startOrStopVideoRecord}>
            Stop Video Recording ( { getRecordedVideoTimeAsClock() } )
          </button>
        }

        { 
          ! ( isVideoRecording ) &&  
          <button className={ isScreenRecording ? 'btn btn-danger' : 'btn' } onClick={startOrStopScreenRecord}>
            { isScreenRecording ? `Stop Screen Recording ( ${getRecordedScreenTimeAsClock()} )` : 'Start Screen Recording' }
          </button>
        }
      </div>

      <div className="chathead-container">
        <div className="chathead">
          <video muted preload="auto" loop autoPlay src="https://wpwax.com/wp-content/uploads/2022/12/HelpGent.mp4"></video>
        </div>
      </div>
    </div>
  )
}

export default App
