export const resolutions = {
	360: { width: 640, height: 360 },
	480: { width: 640, height: 480 },
	720: { width: 1280, height: 720 },
	1080: { width: 1920, height: 1080 },
	1440: { width: 2560, height: 1440 },
	2160: { width: 3840, height: 2160, hdKey: '4K' },
	7680: { width: 7680, height: 4320, hdKey: '8K' },
};

export function getLabel( resolution ) {
	const hd = ( resolution.hdKey ) ? ` (${resolution.hdKey})` : '';
	return `${resolution.height}p${hd}: ${resolution.width}x${resolution.height}`;
}

export function parseOption( key ) {

	if ( typeof resolutions[ key ] === 'undefined' ) {
		return { value: '', label: '' };
	}

	return { value: parseInt( key ), label: getLabel( resolutions[ key ] ) };
};

export const options = Object.keys( resolutions ).map( parseOption ).reverse();