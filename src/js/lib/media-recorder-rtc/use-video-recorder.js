import { useEffect, useRef, useState } from "react";
import RecordRTC from "recordrtc";
import { resolutions } from './video-resolution';
import { formatTimeAsClock } from "./utils";

export function useVideoRecorder( config ) {
    const defaultConfig = {
		maxRecordLength: null,
		alertTimeBeforeStop: 10,
		resolution: null,
	};

	config = ( config && typeof config === 'object' ) ? { ...defaultConfig, ...config } : defaultConfig;

	const [ isRecording, setIsRecording ]             = useState( false );
	const [ isRecordingPaused, setIsRecordingPaused ] = useState( false );
	const [ permissionDenied, setPermissionDenied ]   = useState( null );

	const [ recordedTimeInSecond, setRecordedTimeInSecond ] = useState( 0 );
	const [ recordedBlob, setRecordedBlob ]                 = useState( null );
	const [ recordedURL, setRecordedURL ]                   = useState( '' );

	const [ recordingIsGoingToStopSoon, setRecordingIsGoingToStopSoon ] = useState( false );

	const recorderRef       = useRef();
	const streamRef         = useRef();
	const recordingTimerRef = useRef();
	const videoStreamRef    = useRef();

	useEffect( () => {
		if ( ! config.maxRecordLength ) {
			return;
		}

		if ( reversedRecordedTimeInSecond() <= config.alertTimeBeforeStop ) {
			setRecordingIsGoingToStopSoon( true );
		}

		if ( recordedTimeInSecond >= config.maxRecordLength ) {
			stopRecording();
		}

	}, [ recordedTimeInSecond ] );

	// hasPermission
    async function hasPermission() {
        try {
            const microphonePermission = await navigator.permissions.query({
                name: 'microphone',
            });

			const status  = (
				microphonePermission.state === 'granted'
			);

            return status;
        } catch (_) {
            return false;
        }
    }

	// Request Permission
    async function requestPermission() {
        try {
			await navigator.mediaDevices.getUserMedia({
				audio: true,
				video: true,
			});

			return true;
        } catch (error) {
            console.error({ error });
            setPermissionDenied(true);

			return false;
        }
    }

	function getResolution() {
		const configResolution   = config.resolution && ! isNaN( config.resolution ) ?  `${config.resolution}` : null;
		const selectedResolution = ( configResolution && Object.keys( resolutions ).includes( configResolution ) ) ? resolutions[ configResolution ] : null;

		return selectedResolution;
	}

    async function setupStream() {
        try {
			const resolution = getResolution();

			let videoStreamConfig = {};

			if ( resolution ) {
				videoStreamConfig = {
					width: { ideal: resolution.width },
					height: { ideal: resolution.height },
				}
			}

            // Setup Screen Stream
            streamRef.current = await navigator.mediaDevices.getUserMedia({
				audio: {
					echoCancellation: true,
					noiseSuppression: true,
				},
				video: {
					facingMode: 'user',
					...videoStreamConfig,
				},
			});


            recorderRef.current = new RecordRTC( streamRef.current, {
                type: 'video',
                mimeType: 'video/webm;codecs=vp9',
                recorderType: RecordRTC.MediaStreamRecorder,
                disableLogs: true,
				numberOfAudioChannels: 1,
            });

			if ( videoStreamRef.current.srcObject ) {
                videoStreamRef.current.srcObject
                    .getVideoTracks()
                    .forEach((track) => {
                        track.stop();
                        videoStreamRef.current.srcObject.removeTrack(track);
                    });
            }

			if ( videoStreamRef.current ) {
				videoStreamRef.current.srcObject = streamRef.current;
            	videoStreamRef.current.play();
			}
			
			return recorderRef.current;

        } catch (error) {
            console.error({ error });
            setIsRecording( false );

			return false;
        }
    }

	// Start Recording
    async function startRecording() {
		if ( ! recorderRef.current ) {
			return false;
		}

		await recorderRef.current.startRecording();

		setRecordingIsGoingToStopSoon( false );
        setRecordedTimeInSecond(0);
        setIsRecording(true);
        startTimer();

		return true;
    }

	// Stop Recording
    function stopRecording( args ) {
		setIsRecordingPaused(false);
		const defaultArgs = { terminate: false };
		args = ( args && typeof args === 'object' ) ? { ...defaultArgs, ...args } : defaultArgs;

        stopTimer();

		const state = ( recorderRef.current ) ? recorderRef.current.getState() : 'inactive';

		if ( 'inactive' === state ) {
			if ( streamRef.current ) {
				streamRef.current.getTracks().forEach((track) => track.stop());
			}

			recorderRef.current = null;

			setRecordedTimeInSecond(0);
			setIsRecording(false);

			afterStopRecording();
			return;
		}

        recorderRef.current.stopRecording( function ( url ) {
            const blob = recorderRef.current.getBlob();

            streamRef.current.getTracks().forEach((track) => track.stop());

			setRecordingIsGoingToStopSoon( false );
            setRecordedBlob(blob);
            setRecordedURL(url);
            setIsRecording(false);

			if ( ! args.terminate ) {
				afterStopRecording( { blob, url } );
			}

        });
    }

	// Resume Recording
    async function resumeRecording() {

		if ( ! recorderRef.current ) {
			return false;
		}

		await recorderRef.current.resumeRecording();
		setIsRecording(true);
		setIsRecordingPaused(false);
		startTimer();
		
		return true;
    }

	// Pause Recording
    async function pauseRecording() {
		if ( ! recorderRef.current ) {
			return false;
		}

		if ( isRecording ) {
            await recorderRef.current.pauseRecording();
            setIsRecording(false);
            setIsRecordingPaused(true);
            stopTimer();
        }
		
		return true;
    }

	function afterStopRecording( recordingData ) {
		if ( config && config.afterStopRecording && typeof config.afterStopRecording === 'function' ) {
			config.afterStopRecording( recordingData );
		}
	}

	function startTimer() {
        recordingTimerRef.current = setInterval(function () {
            setRecordedTimeInSecond(function (currentValue) {
                return currentValue + 1;
            });
        }, 1000);
    }

    function stopTimer() {
        clearInterval( recordingTimerRef.current );
    }

	function reversedRecordedTimeInSecond() {
		return ( config.maxRecordLength - recordedTimeInSecond );
	}

	function getCountDown() {

		if ( ! config.maxRecordLength || recordedTimeInSecond < 1 ) {
			return formatSecondsAsCountdown( recordedTimeInSecond );
		}

		return formatSecondsAsCountdown( reversedRecordedTimeInSecond() );
	}

	function getRecordedTimeAsClock() {
		return formatTimeAsClock( recordedTimeInSecond );
	}

	function reset() {
		if ( isRecording ) {
			stopRecording( { terminate: true } );
		}

		if ( streamRef.current ) {
			streamRef.current.getTracks().forEach((track) => track.stop());
		}

		recorderRef.current       = null;
		streamRef.current         = null;
		recordingTimerRef.current = null;

		setIsRecording( false );
		setRecordedTimeInSecond( 0 );
		setRecordedBlob( null );
		setRecordedURL( '' );
	}

	return {
		recorder: recorderRef.current,
		isRecording,
		isRecordingPaused,
		permissionDenied,
		recordedTimeInSecond,
		recordedBlob,
		recordedURL,
		recordingIsGoingToStopSoon,
		videoStreamRef,
		hasPermission,
		requestPermission,
		setupStream,
		startRecording,
		resumeRecording,
		pauseRecording,
		stopRecording,
		getRecordedTimeAsClock,
		getCountDown,
		reset,
	};
}