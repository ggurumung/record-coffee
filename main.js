// =========================
// 설정
// =========================
const ACCESS_PASSWORD = "1234"; 
const ADMIN_PASSWORD = "admin"; // 관리자 비밀번호
const STORAGE_KEY = "coffee_meeting_board_posts";
const AUTH_KEY = "coffee_meeting_board_auth";
const THEME_KEY = "coffee_meeting_board_theme";
const ADMIN_KEY = "coffee_meeting_board_admin";

// =========================
// 요소
// =========================
const loginScreen = document.getElementById("loginScreen");
const appScreen = document.getElementById("appScreen");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const adminBtn = document.getElementById("adminBtn");

const newPostBtn = document.getElementById("newPostBtn");
const editorPanel = document.getElementById("editorPanel");
const editorTitle = document.getElementById("editorTitle");
const postType = document.getElementById("postType");
const authorInput = document.getElementById("authorInput");
const titleInput = document.getElementById("titleInput");
const contentInput = document.getElementById("contentInput");
const fileInput = document.getElementById("fileInput");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelBtn");
const postsContainer = document.getElementById("postsContainer");
const searchInput = document.getElementById("searchInput");
const filterType = document.getElementById("filterType");

const startRecordBtn = document.getElementById("startRecordBtn");
const stopRecordBtn = document.getElementById("stopRecordBtn");
const clearRecordedBtn = document.getElementById("clearRecordedBtn");
const recordStatus = document.getElementById("recordStatus");
const recordTimer = document.getElementById("recordTimer");
const recordedPreview = document.getElementById("recordedPreview");

const themeToggleBtns = document.querySelectorAll(".theme-toggle");

// =========================
// 테마 관리
// =========================
function initTheme() {
  const savedTheme = localStorage.getItem(THEME_KEY) || "light";
  applyTheme(savedTheme);
}

function applyTheme(theme) {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(THEME_KEY, theme);
  
  themeToggleBtns.forEach(btn => {
    btn.textContent = theme === "dark" ? "☀️" : "🌙";
    btn.setAttribute("title", theme === "dark" ? "라이트 모드로 전환" : "다크 모드로 전환");
  });
}

function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
  const newTheme = currentTheme === "light" ? "dark" : "light";
  applyTheme(newTheme);
}

themeToggleBtns.forEach(btn => {
  btn.addEventListener("click", toggleTheme);
});

// =========================
// 관리자 모드
// =========================
let isAdmin = localStorage.getItem(ADMIN_KEY) === "true";

function updateAdminUI() {
  if (isAdmin) {
    adminBtn.textContent = "관리자 로그아웃";
    adminBtn.classList.replace("btn-gray", "btn-danger");
    if (!document.querySelector(".admin-badge-title")) {
      const badge = document.createElement("span");
      badge.className = "admin-badge admin-badge-title";
      badge.textContent = "ADMIN MODE";
      document.querySelector(".top-title h1").appendChild(badge);
    }
  } else {
    adminBtn.textContent = "관리자 모드";
    adminBtn.classList.replace("btn-danger", "btn-gray");
    const badge = document.querySelector(".admin-badge-title");
    if (badge) badge.remove();
  }
  renderPosts();
}

adminBtn.addEventListener("click", () => {
  if (isAdmin) {
    isAdmin = false;
    localStorage.removeItem(ADMIN_KEY);
    alert("관리자 모드가 해제되었습니다.");
  } else {
    const pw = prompt("관리자 비밀번호를 입력하세요.");
    if (pw === ADMIN_PASSWORD) {
      isAdmin = true;
      localStorage.setItem(ADMIN_KEY, "true");
      alert("관리자 모드로 전환되었습니다.");
    } else if (pw !== null) {
      alert("비밀번호가 틀렸습니다.");
    }
  }
  updateAdminUI();
});

// =========================
// 상태
// =========================
let posts = loadPosts();
let editingId = null;

let mediaRecorder = null;
let recordedChunks = [];
let recordedFileData = null; 

let recordStartTime = null;
let recordInterval = null;

// =========================
// 로그인
// =========================
function checkLoginState() {
  const authed = localStorage.getItem(AUTH_KEY);
  if (authed === "true") {
    showApp();
  } else {
    showLogin();
  }
}

function showLogin() {
  loginScreen.classList.remove("hidden");
  appScreen.classList.add("hidden");
}

function showApp() {
  loginScreen.classList.add("hidden");
  appScreen.classList.remove("hidden");
  updateAdminUI();
  renderPosts();
}

loginBtn.addEventListener("click", () => {
  const value = passwordInput.value.trim();
  if (value === ACCESS_PASSWORD) {
    localStorage.setItem(AUTH_KEY, "true");
    showApp();
  } else {
    alert("비밀번호가 올바르지 않습니다.");
  }
});

passwordInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") loginBtn.click();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(AUTH_KEY);
  localStorage.removeItem(ADMIN_KEY);
  isAdmin = false;
  showLogin();
});

// =========================
// 로컬 스토리지
// =========================
function loadPosts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error("불러오기 실패:", error);
    return [];
  }
}

function savePosts() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
}

// =========================
// 에디터 열기/닫기
// =========================
newPostBtn.addEventListener("click", () => {
  openEditor();
});

cancelBtn.addEventListener("click", () => {
  closeEditor();
});

function openEditor(post = null) {
  editorPanel.classList.remove("hidden");
  editorPanel.classList.remove("edit-mode");
  fileInput.value = "";

  if (post) {
    editingId = post.id;
    editorTitle.textContent = "글 수정";
    editorPanel.classList.add("edit-mode");
    postType.value = post.type;
    authorInput.value = post.author || "";
    titleInput.value = post.title || "";
    contentInput.value = post.content || "";

    if (post.file) {
      recordedFileData = post.file;
      updateRecordedPreview(post.file);
    } else {
      clearRecordedData();
    }
  } else {
    editingId = null;
    editorTitle.textContent = "새 글 작성";
    postType.value = "record";
    authorInput.value = "";
    titleInput.value = "";
    contentInput.value = "";
    clearRecordedData();
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
}

function closeEditor() {
  editorPanel.classList.add("hidden");
  editingId = null;
  postType.value = "record";
  authorInput.value = "";
  titleInput.value = "";
  contentInput.value = "";
  fileInput.value = "";
  clearRecordedData();
}

// =========================
// 파일 업로드
// =========================
fileInput.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const dataUrl = await fileToDataURL(file);
    recordedFileData = {
      name: file.name,
      type: file.type || getMimeTypeByName(file.name),
      dataUrl
    };
    updateRecordedPreview(recordedFileData);
  } catch (error) {
    console.error(error);
    alert("파일을 불러오는 중 오류가 발생했습니다.");
  }
});

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function getMimeTypeByName(name) {
  const lower = name.toLowerCase();
  if (lower.endsWith(".pdf")) return "application/pdf";
  if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
  if (lower.endsWith(".png")) return "image/png";
  if (lower.endsWith(".webp")) return "image/webp";
  if (lower.endsWith(".mp3")) return "audio/mpeg";
  if (lower.endsWith(".wav")) return "audio/wav";
  if (lower.endsWith(".m4a")) return "audio/mp4";
  return "application/octet-stream";
}

// =========================
// 녹음 기능
// =========================
startRecordBtn.addEventListener("click", async () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !window.MediaRecorder) {
    alert("이 브라우저는 녹음 기능을 지원하지 않습니다. 파일 업로드를 사용해주세요.");
    return;
  }

  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunks.push(event.data);
    };

    mediaRecorder.onstop = async () => {
      stopTimer();
      const blob = new Blob(recordedChunks, { type: mediaRecorder.mimeType || "audio/webm" });
      const ext = blob.type.includes("mp4") ? "m4a" : "webm";
      const file = new File([blob], `recording_${Date.now()}.${ext}`, { type: blob.type });
      const dataUrl = await fileToDataURL(file);

      recordedFileData = {
        name: file.name,
        type: file.type,
        dataUrl
      };

      updateRecordedPreview(recordedFileData);
      recordStatus.textContent = "녹음이 저장되었습니다.";
      stream.getTracks().forEach(track => track.stop());
    };

    mediaRecorder.start();
    startTimer();
    recordStatus.textContent = "녹음 중...";
    startRecordBtn.disabled = true;
    stopRecordBtn.disabled = false;
  } catch (error) {
    console.error(error);
    alert("마이크 권한이 없거나 녹음을 시작할 수 없습니다.");
  }
});

function startTimer() {
  recordStartTime = Date.now();
  recordTimer.classList.remove("hidden");
  recordTimer.textContent = "(00:00)";
  recordInterval = setInterval(() => {
    const seconds = Math.floor((Date.now() - recordStartTime) / 1000);
    const m = String(Math.floor(seconds / 60)).padStart(2, "0");
    const s = String(seconds % 60).padStart(2, "0");
    recordTimer.textContent = `(${m}:${s})`;
  }, 1000);
}

function stopTimer() {
  clearInterval(recordInterval);
  recordTimer.classList.add("hidden");
}

stopRecordBtn.addEventListener("click", () => {
  if (mediaRecorder && mediaRecorder.state !== "inactive") {
    mediaRecorder.stop();
    startRecordBtn.disabled = false;
    stopRecordBtn.disabled = true;
  }
});

clearRecordedBtn.addEventListener("click", () => {
  clearRecordedData();
  fileInput.value = "";
});

function updateRecordedPreview(fileObj) {
  if (!fileObj) {
    recordedPreview.classList.add("hidden");
    recordedPreview.src = "";
    return;
  }

  if (fileObj.type && fileObj.type.startsWith("audio/")) {
    recordedPreview.src = fileObj.dataUrl;
    recordedPreview.classList.remove("hidden");
  } else {
    recordedPreview.classList.add("hidden");
    recordedPreview.src = "";
  }
}

function clearRecordedData() {
  recordedFileData = null;
  recordedChunks = [];
  recordedPreview.classList.add("hidden");
  recordedPreview.src = "";
  recordStatus.textContent = "대기 중";
  startRecordBtn.disabled = false;
  stopRecordBtn.disabled = true;
}

// =========================
// 저장
// =========================
saveBtn.addEventListener("click", () => {
  const type = postType.value;
  const author = authorInput.value.trim();
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!author) {
    alert("작성자를 입력해주세요.");
    return;
  }

  if (!title) {
    alert("제목을 입력해주세요.");
    return;
  }

  if (!content && !recordedFileData) {
    alert("내용 또는 파일/녹음 중 하나 이상 필요합니다.");
    return;
  }

  const now = new Date();
  const postData = {
    id: editingId || Date.now().toString(),
    type,
    author,
    title,
    content,
    file: recordedFileData,
    comments: editingId ? (posts.find(p => p.id === editingId)?.comments || []) : [],
    createdAt: editingId
      ? (posts.find(p => p.id === editingId)?.createdAt || now.toISOString())
      : now.toISOString(),
    updatedAt: now.toISOString()
  };

  if (editingId) {
    posts = posts.map(p => p.id === editingId ? postData : p);
  } else {
    posts.unshift(postData);
  }

  savePosts();
  renderPosts();
  closeEditor();
});

// =========================
// 목록 렌더링
// =========================
function renderPosts() {
  const keyword = searchInput.value.trim().toLowerCase();
  const typeFilter = filterType.value;

  let filtered = [...posts];

  if (typeFilter !== "all") {
    filtered = filtered.filter(post => post.type === typeFilter);
  }

  if (keyword) {
    filtered = filtered.filter(post => {
      return (
        (post.title || "").toLowerCase().includes(keyword) ||
        (post.author || "").toLowerCase().includes(keyword) ||
        (post.content || "").toLowerCase().includes(keyword)
      );
    });
  }

  if (filtered.length === 0) {
    postsContainer.innerHTML = `
      <div class="empty">
        등록된 글이 없습니다.
      </div>
    `;
    return;
  }

  postsContainer.innerHTML = filtered.map(post => {
    const typeLabel = post.type === "record" ? "녹음기록" : "요약본";
    const created = formatDate(post.createdAt);
    const updated = formatDate(post.updatedAt);

    return `
      <article class="post">
        <div class="post-head">
          <div>
            <div class="badge">${typeLabel}</div>
            <h3 class="post-title">${escapeHtml(post.title)}</h3>
            <div class="meta">
              작성자: ${escapeHtml(post.author)}<br />
              작성일: ${created}<br />
              수정일: ${updated}
            </div>
          </div>
        </div>

        ${post.content ? `<div class="post-content">${escapeHtml(post.content)}</div>` : ""}

        ${renderFilePreview(post.file)}

        <div class="post-actions">
          ${isAdmin ? `
            <button class="btn btn-secondary" onclick="editPost('${post.id}')">수정</button>
            <button class="btn btn-danger" onclick="deletePost('${post.id}')">삭제</button>
          ` : ""}
        </div>

        <!-- 댓글 섹션 -->
        <div class="comments-section">
          <div class="comment-list">
            ${(post.comments || []).map(comment => `
              <div class="comment">
                <div class="comment-head">
                  <span class="comment-author">${escapeHtml(comment.author)}</span>
                  <span class="comment-date">${formatDate(comment.createdAt)}</span>
                </div>
                <div class="comment-content">${escapeHtml(comment.content)}</div>
                <div class="comment-actions">
                  ${(isAdmin || localStorage.getItem(`comment_author_${comment.id}`) === "true") ? `
                    <span onclick="deleteComment('${post.id}', '${comment.id}')">삭제</span>
                  ` : ""}
                </div>
              </div>
            `).join("")}
          </div>
          <div class="comment-form">
            <input type="text" class="comment-input" id="cmtInput_${post.id}" placeholder="댓글을 입력하세요..." onkeydown="if(event.key==='Enter') addComment('${post.id}')">
            <button class="btn btn-primary btn-sm" onclick="addComment('${post.id}')">등록</button>
          </div>
        </div>
      </article>
    `;
  }).join("");
}

function renderFilePreview(file) {
  if (!file || !file.dataUrl) return "";

  const safeName = escapeHtml(file.name || "첨부파일");
  const type = file.type || "";

  if (type.startsWith("audio/")) {
    return `
      <div class="file-preview">
        <div class="meta">첨부파일: ${safeName}</div>
        <audio controls src="${file.dataUrl}"></audio>
      </div>
    `;
  }

  if (type.startsWith("image/")) {
    return `
      <div class="file-preview">
        <div class="meta">첨부파일: ${safeName}</div>
        <img src="${file.dataUrl}" alt="${safeName}" />
      </div>
    `;
  }

  if (type === "application/pdf") {
    return `
      <div class="file-preview">
        <div class="meta">첨부파일: ${safeName}</div>
        <iframe src="${file.dataUrl}"></iframe>
        <div style="margin-top:8px;">
          <a href="${file.dataUrl}" download="${safeName}" class="btn btn-secondary" style="display:inline-block; text-decoration:none;">PDF 다운로드</a>
        </div>
      </div>
    `;
  }

  return `
    <div class="file-preview">
      <div class="meta">첨부파일: ${safeName}</div>
      <a href="${file.dataUrl}" download="${safeName}" class="btn btn-secondary" style="display:inline-block; text-decoration:none;">파일 다운로드</a>
    </div>
  `;
}

// =========================
// 댓글 기능
// =========================
window.addComment = function(postId) {
  const input = document.getElementById(`cmtInput_${postId}`);
  const content = input.value.trim();
  if (!content) return;

  const author = prompt("작성자 이름을 입력하세요.");
  if (!author) return;

  const post = posts.find(p => p.id === postId);
  if (!post) return;

  if (!post.comments) post.comments = [];
  
  const commentId = Date.now().toString();
  const newComment = {
    id: commentId,
    author,
    content,
    createdAt: new Date().toISOString()
  };

  post.comments.push(newComment);
  // 본인이 작성한 댓글임을 로컬스토리지에 임시 저장 (삭제 권한용)
  localStorage.setItem(`comment_author_${commentId}`, "true");

  savePosts();
  renderPosts();
};

window.deleteComment = function(postId, commentId) {
  if (!confirm("댓글을 삭제하시겠습니까?")) return;

  const post = posts.find(p => p.id === postId);
  if (!post) return;

  post.comments = post.comments.filter(c => c.id !== commentId);
  localStorage.removeItem(`comment_author_${commentId}`);

  savePosts();
  renderPosts();
};

// =========================
// 수정 / 삭제 (관리자 전용)
// =========================
window.editPost = function(id) {
  if (!isAdmin) {
    alert("관리자만 수정할 수 있습니다.");
    return;
  }
  const post = posts.find(p => p.id === id);
  if (!post) return;
  openEditor(post);
}

window.deletePost = function(id) {
  if (!isAdmin) {
    alert("관리자만 삭제할 수 있습니다.");
    return;
  }
  const post = posts.find(p => p.id === id);
  if (!post) return;

  const ok = confirm(`"${post.title}" 글을 삭제하시겠습니까?`);
  if (!ok) return;

  posts = posts.filter(p => p.id !== id);
  savePosts();
  renderPosts();

  if (editingId === id) {
    closeEditor();
  }
}

// =========================
// 검색/필터
// =========================
searchInput.addEventListener("input", renderPosts);
filterType.addEventListener("change", renderPosts);

// =========================
// 유틸
// =========================
function formatDate(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// =========================
// 시작
// =========================
initTheme();
checkLoginState();
