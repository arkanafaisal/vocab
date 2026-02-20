/*

juga ini lagi
const statusDot = (socket && socket.connected) 
                    ? '<span class="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></span>' 
                    : '<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>';

                userSection.innerHTML = `
                    <div class="flex items-center gap-3">
                        <div class="hidden md:flex flex-col items-end">
                            <div class="flex items-center gap-1.5">
                                ${statusDot}
                                <span class="text-xs font-bold text-slate-300">${state.user.username}</span>
                            </div>
                        </div>
                        <button id="desktop-user-info-btn" class="hidden md:block p-2 text-slate-400 hover:text-white transition-colors" title="Profil Saya">
                           <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
                        </button>
                        <button id="fullscreen-btn" class="p-2 text-slate-400 hover:text-white transition-colors" title="Toggle Fullscreen">
                           ${Icons.Fullscreen}
                        </button>
                        <button id="logout-confirm-btn-header" class="flex items-center gap-2 px-3 py-1.5 border border-rose-900/50 text-rose-400 bg-dark-800 rounded-xl text-xs font-bold hover:bg-rose-900/20 transition-all shadow-sm" title="Logout">
                            ${Icons.LogOut} <span class="hidden md:inline">Logout</span>
                        </button>
                    </div>
                `;



sudah dibilang jangan DOM yang seperti itu, jangan yang hardcoded di javascriptnya, langsung saja tulis di main body htmlnya, tinggal mainkan hidden tidaknya kalau close open, tinggal mainkan .queryselector().textContent kalau mau merubah datanya, mainkan add remove class kalau butuh animasi





tolong jangan error ya, ini perubahan massive soalnya
pastikan jangan ada yang undefined, cek semua html tag, id, variable name, function, dan keterkaitan antar kodenya
soalnya ini sudah saya retry beberapa kali promptnya, tetap saja ada yang error, kebanyakan karena tag html tidak ada sih di body, jadi addeventlistenernya ditambahkan pada undefined


*/
















/*

tolong modal reset-password (saat memilih kirim link atau batal) itu ketika open modalnya sama seperti yang update email maupun username, bukan close profile lalu membuka modalnya (terlihat jelek ada kedipnya dulu), saat menutup juga, bukannya langsung profil malah terlihat leaderboardnya dulu baru terbuka profilnya 


tolong animasi streak pada leaderboard itu sinkron dengan yang quiz ya, jadi state user saat itu bukan harus refresh dulu baru berubah ui streaknya



cuma itu yang height quiz cardnya, kenapa dalamnya (jawaban) itu masih muncul scrollbar walaupun height pc normal? saya belum tes kalau versi mobile sih, tolong jangan ketinggian atau melebihi parent di height normal sehingga tidak muncul scrollbar




jangan sampai error, jumlah linenya harusnya sekitar 2050, kalau bukan ya berarti ada yang kurang, variabel, fungsi, html tag, dll


*/