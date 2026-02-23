import { useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";

export function useSocket(socketRef, params) {
    const paramsRef = useRef(params);

    const timeoutRef = useRef(null);


    useEffect(() => {
        paramsRef.current = params;
    });

    const connectSocket = useCallback(() => {
        if (socketRef.current) return;

        try {
            const socket = io("/", { withCredentials: true, transports: ['websocket'] });
            socketRef.current = socket;

            // Gunakan paramsRef.current.[nama_fungsi] di dalam semua listener
            socket.on("connect", () => {
                paramsRef.current.setIsSocketConnected(true);
            });

            socket.on("disconnect", () => {
                paramsRef.current.setIsSocketConnected(false);
                paramsRef.current.setQuizUI(prev =>
                    prev.isValidating
                        ? { ...prev, isValidating: false, selectedAnswer: null, animationFinished: false, pendingResult: null }
                        : prev
                );
            });

            socket.on("warn", async (data) => {
                const { code, message } = data;
                const msg = message || "Terjadi peringatan dari server.";
                const { setActiveModal, showToast, retryCountRef, api, handleLogoutCleanup } = paramsRef.current;

                switch (code) {
                    case 1001:
                    case 1004:
                        setActiveModal('connection');
                        socket.disconnect();
                        break;
                    case 1002:
                        showToast(msg, 'error');
                        break;
                    case 1003:
                        showToast(msg, 'error');
                        retryCountRef.current += 1;
                        if (retryCountRef.current > 3) window.location.reload();
                        else setTimeout(() => { if (socket.disconnected) socket.connect(); }, 1000);
                        break;
                    case 1005:
                        showToast(msg, 'error');
                        await api.logout();
                        handleLogoutCleanup();
                        break;
                    default:
                        showToast(msg, 'error');
                }
            });

            socket.on("connect_error", async () => {
                const { API_BASE_URL, handleLogoutCleanup } = paramsRef.current;
                const res = await fetch(`${API_BASE_URL}/auth/refresh`, { method: 'POST' });

                if (res.ok) socket.connect();
                else handleLogoutCleanup("Gagal terhubung ke game server. Silakan login ulang.");
            });

            socket.on("new_question", (q) => {
                paramsRef.current.setQuestion(q);
                paramsRef.current.setQuizUI({
                    selectedAnswer: null,
                    isValidating: false,
                    isTransitioning: false,
                    correctAnswerText: null,
                    animationFinished: false,
                    pendingResult: null,
                    showRetry: false,
                    popScore: false
                });
            });

            socket.on("answer_result", (res) => {
                paramsRef.current.setQuizUI(prev => ({ ...prev, pendingResult: res }));
            });

        } catch (e) {
            console.error("Socket init failed", e);
        }
    }, []); // Dependency array KOSONG! connectSocket tidak perlu dibuat ulang.

    // 3. (Opsional tapi disarankan) Cleanup saat komponen di-unmount
    const requestQuestion = useCallback(() => {
        if (socketRef.current && socketRef.current.connected) {
            socketRef.current.emit("request_question");
        }

        // Cegah bug jika tombol dipanggil berkali-kali dengan cepat
        if (timeoutRef.current) clearTimeout(timeoutRef.current);

        timeoutRef.current = setTimeout(() => {
            // Kita gunakan paramsRef.current untuk mengambil setQuizUI versi terbaru
            paramsRef.current.setQuizUI(prev => {
                if (prev.isValidating) return prev;
                return { ...prev, showRetry: true };
            });
        }, 3000);
    }, [])

    useEffect(() => {
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
            }
        };
    }, []);

    return { connectSocket, requestQuestion};
}