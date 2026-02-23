export const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => { });
    } else if (document.exitFullscreen) {
        document.exitFullscreen();
    }
};