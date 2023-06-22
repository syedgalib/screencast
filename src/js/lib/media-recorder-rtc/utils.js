export function formatTimeAsClock( timeInSecond ) {
    return ( typeof timeInSecond === 'number' ) ? new Date( timeInSecond * 1000).toISOString().substring(14, 19) : '00:00';
}