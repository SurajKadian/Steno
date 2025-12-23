let text1 = document.getElementById("text1");
var text2 = document.getElementById("transcription");
var outputDiv = document.getElementById("output-div");
var submit = document.getElementById("submit-btn");
let submitButtonClicked = false;
let autoClick = false;
let copyPaste = false;
var result = document.getElementById('result');
var output = document.getElementById("output");
const timer = document.getElementById('timer');
let timeTotal = 3000;
let timeLeft = timeTotal;
let hm = 30;

const optionsScreen = document.getElementById("options-screen");
const workspace = document.getElementById("workspace");

let countdownInterval;
let audio;
const buttons = document.querySelectorAll(".card-btn");

const popup = document.getElementById("popup");
const popupTitle = document.getElementById("popup-title");
const popupBody = document.getElementById("popup-body");
const popupClose = document.getElementById("popup-close");
const popupOk = document.getElementById("popup-ok");

function showPopup(title, bodyHTML, onOk) {
    popupTitle.textContent = title;
    popupBody.innerHTML = bodyHTML;
    popup.style.display = "flex";

    const okBtn = document.getElementById("popup-ok");
    const newOk = okBtn.cloneNode(true);
    okBtn.parentNode.replaceChild(newOk, okBtn);

    newOk.addEventListener("click", () => {
        popup.style.display = "none";
        if (onOk) onOk();
    });
}

popup.addEventListener("click", e => {
    if (e.target === popup) {
        popup.style.display = 'none';
    }
});

popupClose.addEventListener("click", () => {
    popup.style.display = "none";
});

document.querySelectorAll(".group-toggle").forEach(toggle => {
    toggle.addEventListener("click", (e) => {
        const el = e.currentTarget;
        if (el.classList.contains("soon")) {
            showPopup(
                "These dictations will be available soon...", ``,
                () => { }
            );
        } else {
            const list = toggle.nextElementSibling;
            const isVisible = list.style.display === "flex";
            document.querySelectorAll(".group-list").forEach(gl => gl.style.display = "none");
            list.style.display = isVisible ? "none" : "flex";
        }
    });
});


function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
}

function startCountdown(duration, onFinish) {
    timeLeft = duration;
    timer.textContent = formatTime(timeLeft);

    countdownInterval = setInterval(() => {
        timeLeft--;
        timer.textContent = formatTime(timeLeft);

        if (timeLeft === 0) {
            clearInterval(countdownInterval);
            onFinish();
        }
    }, 1000);
}

// Stage 1: Reading Stage 
function startReadingStage() {
    optionsScreen.style.display = "none";
    workspace.style.display = "none";

    const readingScreen = document.createElement("div");
    readingScreen.id = "reading-screen";
    readingScreen.style.display = "flex";
    readingScreen.style.flexDirection = "column";
    readingScreen.style.justifyContent = "center";
    readingScreen.style.alignItems = "center";
    readingScreen.style.height = "90vh";
    readingScreen.innerHTML = `
      <h1 style="font-size:2rem; margin:20px;">10 Minutes for Reading</h1>
      <div style="font-size:2rem; margin-bottom:20px;" id="reading-timer"></div>
      <button id="skip-reading" class="submit-btn">Skip Reading</button>
    `;
    document.body.appendChild(readingScreen);

    const readingTimer = document.getElementById("reading-timer");

    let remaining = 600;
    readingTimer.textContent = formatTime(remaining);
    timer.textContent = formatTime(remaining);

    countdownInterval = setInterval(() => {
        remaining--;
        readingTimer.textContent = formatTime(remaining);
        timer.textContent = formatTime(remaining);

        if (remaining <= 0) {
            clearInterval(countdownInterval);
            readingScreen.remove();
            startTranscriptionStage();
        }
    }, 1000);

    document.getElementById("skip-reading").addEventListener("click", () => {
        clearInterval(countdownInterval);
        readingScreen.remove();
        startTranscriptionStage();
    });
}

// Stage 2: Transcription Stage
function startTranscriptionStage() {
    workspace.style.display = "flex";
    text2.value = "";

    startCountdown(timeLeft, () => {
        submit.click();
        autoClick = true;
    });
}

// Dictation buttons
document.querySelectorAll(".card-btn").forEach(btn => {
    btn.addEventListener("click", async (e) => {
        const el = e.currentTarget;
        if (el.classList.contains("soon")) {
            showPopup(
                "These dictations will be available soon...", ``,
                () => { }
            );
        } else {
            const audioFile = btn.dataset.audio;
            const textFile = btn.dataset.text;

            if (audioFile !== "custom") {

                showPopup(
                    "Instructions", `
                <p>The dictation audio will play next</p>
                <p>After the dictation finishes, you will get <strong>10 minutes</strong> to read your outlines.</p>
                <p>Then you will get <strong>50 minutes</strong> to transcribe.</p>
                <p>Select speed for dictation (in <b>WPM</b>): </p>
                <div class="speed-options">
                <button class="speed-btn" data-speed="0.8">80</button>
                <button class="speed-btn" data-speed="0.9">90</button>
                <button class="speed-btn active" data-speed="1.0">100</button>
                <button class="speed-btn" data-speed="1.1">110</button>
                <button class="speed-btn" data-speed="1.2">120</button>
                </div>`,
                    () => {
                        optionsScreen.style.display = "none";
                        audio = new Audio(audioFile);
                        document.getElementById("audio-screen").style.display = "block";
                        document.getElementById("audio-title").textContent = "Playing: " + btn.textContent;

                        audio.addEventListener("loadedmetadata", () => {
                            const originalDuration = audio.duration;
                            const effectiveDuration = originalDuration / selectedSpeed;

                            const audioTime = document.getElementById("audio-time");
                            const progressBar = document.getElementById("audio-progress");

                            audio.playbackRate = selectedSpeed;
                            audio.play();

                            const updateInterval = setInterval(() => {
                                const current = audio.currentTime / selectedSpeed;
                                audioTime.textContent =
                                    formatTime(Math.floor(current)) + " / " + formatTime(Math.floor(effectiveDuration));

                                progressBar.style.width = ((current / effectiveDuration) * 100) + "%";

                                if (audio.ended) {
                                    clearInterval(updateInterval);
                                    document.getElementById("audio-screen").style.display = "none";
                                    startReadingStage();
                                }
                            }, 500);
                        });

                        document.getElementById("skip-dictation").addEventListener("click", () => {
                            audio.pause();
                            document.getElementById("audio-screen").style.display = "none";
                            startReadingStage();
                        });
                    }
                );

                let selectedSpeed = 1.0;

                document.querySelectorAll(".speed-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        document.querySelectorAll(".speed-btn").forEach(b => b.classList.remove("active"));
                        btn.classList.add("active");
                        selectedSpeed = parseFloat(btn.dataset.speed);
                    });
                });

                if (textFile) {
                    try {
                        const response = await fetch(textFile);
                        if (!response.ok) throw new Error("Failed to load " + textFile);
                        text1.value = await response.text();
                    } catch (err) {
                        console.error("Error fetching text:", err);
                        text1 = "";
                    }
                }

            } else {
                showPopup(
                    "Custom Dictation",
                    `<p>Get your own dictation, and paste the dictated text below which will be used to calculate errors. </p>
                    <textarea id="custom-text" placeholder="Paste or type master text here..." rows="10"></textarea><br>
                    <div class="speed-options"><button id="clean" class="speed-btn">Clean Master Text</button></div>
                    <div class="speed-options">
                    <button id="up-btn" class="icons custom-btn" onclick="document.getElementById('custom-file').click();">
                    <img src="img/up.svg" class="svg" ><span>Upload Text File</span>
                    <input type="file" id="custom-file" accept=".txt" style="display: none;">
                    </button>
                    <button id="dh-btn" class="icons custom-btn" onclick="window.location.href='https://surajkadian.github.io/Dictation/'">
                    <img src="img/mic.svg" class="svg"><span>Dictation Helper</span>
                    </button></div>`,
                    () => {
                        const customText = document.getElementById("custom-text");
                        if (typeof text1 !== "undefined") {
                            text1.value = cleanMasterText(customText.value);
                        }
                        startReadingStage();
                    }
                );

                const fileInput = document.getElementById("custom-file");
                const customText = document.getElementById("custom-text");

                document.getElementById('clean').addEventListener('click', function () {
                    if (customText) customText.value = cleanMasterText(customText.value);
                });

                if (fileInput && customText) {
                    fileInput.addEventListener('change', function (event) {
                        const file = event.target.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = function (e) {
                                const text = e.target.result;
                                customText.value = cleanMasterText(text);
                            };
                            reader.readAsText(file);
                        }
                    });
                }

            }
        }
    });
});

function errorsPercentage(fullMistakes, halfMistakes, totalWords) {
    if (!isNaN(fullMistakes) && !isNaN(halfMistakes) && !isNaN(totalWords)) {
        var errorsPercentage = ((fullMistakes + (halfMistakes / 2)) / totalWords) * 100;
        return errorsPercentage.toFixed(2);
    } else {
        return 'Could not calculate Error Percentage!';
    }
}

function ld(word1, word2) {
    var m = word1.length;
    var n = word2.length;
    var dp = [];

    for (var i = 0; i <= m; i++) {
        dp[i] = [];
        for (var j = 0; j <= n; j++) {
            if (i === 0) {
                dp[i][j] = j;
            } else if (j === 0) {
                dp[i][j] = i;
            } else if (word1[i - 1] === word2[j - 1]) {
                dp[i][j] = dp[i - 1][j - 1];
            } else {
                dp[i][j] = 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
            }
        }
    }

    var distance = dp[m][n];
    var maxLength = Math.max(m, n);
    var similarityPercentage = ((maxLength - distance) / maxLength) * 100;

    return {
        distance: distance,
        similarityPercentage: similarityPercentage
    };
}

function lcs(text1, text2) {
    var m = text1.length;
    var n = text2.length;
    var output = '';
    var redWords = [];
    var orangeWords = [];
    var blueWords = [];

    var dp = [];
    for (var i = 0; i <= m; i++) {
        dp[i] = [];
        for (var j = 0; j <= n; j++) {
            dp[i][j] = -1;
        }
    }

    function lcsLength(i, j) {
        if (i === 0 || j === 0) {
            return 0;
        }

        if (dp[i][j] !== -1) {
            return dp[i][j];
        }

        if (text1[i - 1] === text2[j - 1]) {
            dp[i][j] = 1 + lcsLength(i - 1, j - 1);
        } else if (ld(text1[i - 1], text2[j - 1]).similarityPercentage >= hm
            && ld(text1[i - 1], text2[j - 1]).similarityPercentage < 100) {
            dp[i][j] = 0.5 + lcsLength(i - 1, j - 1);
        } else {
            dp[i][j] = Math.max(lcsLength(i - 1, j), lcsLength(i, j - 1));
        }

        return dp[i][j];
    }

    function constructLCS(i, j) {
        if (i === 0 && j === 0) {
            return '';
        } else if (i === 0) {
            redWords.push(text2[j - 1]);
            return '<span class="red">' + text2[j - 1] + '</span> ' + constructLCS(i, j - 1);
        } else if (j === 0) {
            orangeWords.push(text1[i - 1]);
            return '<span class="red orange">' + text1[i - 1] + '</span> ' + constructLCS(i - 1, j);
        } else if (text1[i - 1] === text2[j - 1]) {
            return constructLCS(i - 1, j - 1)
                + '<span>' + text1[i - 1] + '</span> ';
        } else if (ld(text1[i - 1], text2[j - 1]).similarityPercentage >= hm
            && ld(text1[i - 1], text2[j - 1]).similarityPercentage < 100) {
            blueWords.push('<span class="blue">' + text1[i - 1]
                + '<span class="green">{' + text2[j - 1] + '}</span></span>');
            return constructLCS(i - 1, j - 1)
                + '<span class="blue">' + text1[i - 1]
                + '<span class="green">{' + text2[j - 1] + '}</span></span> ';
        } else {
            if (lcsLength(i - 1, j) >= lcsLength(i, j - 1)) {
                orangeWords.push(text1[i - 1]);
                return constructLCS(i - 1, j)
                    + '<span class="red orange">' + text1[i - 1] + '</span> ';
            } else {
                redWords.push(text2[j - 1]);
                return constructLCS(i, j - 1)
                    + '<span class="red">' + text2[j - 1] + '</span> ';
            }
        }
    }

    output = constructLCS(m, n);

    return {
        output: output,
        redWords: redWords,
        orangeWords: orangeWords,
        blueWords: blueWords
    };
}

submit.addEventListener('click', function () {
    if (text1.value == "") {
        showPopup(
            "Master Text not found",
            `<p>Paste the master text below which will be used to calculate errors. </p>
            <textarea id="custom-text" placeholder="Paste or type master text here..." rows="10"></textarea>
            <br>
            <div class="speed-options"><button id="clean" class="speed-btn">Clean Master Text</button></div> 
            <div class="speed-options">
            <button id="up-btn" class="icons custom-btn" onclick="document.getElementById('custom-file').click();">
            <img src="img/up.svg" class="svg" ><span>Upload Text File</span>
            <input type="file" id="custom-file" accept=".txt" style="display: none;">
            </button></div>`,
            () => {
                const customText = document.getElementById("custom-text");
                if (typeof text1 !== "undefined") {
                    text1.value = cleanMasterText(customText.value);
                }
                if (text1.value !== "") { submit.click(); }
            }
        );
        const fileInput = document.getElementById("custom-file");
        const customText = document.getElementById("custom-text");


        document.getElementById('clean').addEventListener('click', function () {
            if (customText) customText.value = cleanMasterText(customText.value);
        });

        if (fileInput && customText) {
            fileInput.addEventListener('change', function (event) {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = function (e) {
                        const text = e.target.result;
                        customText.value = cleanMasterText(text);
                    };
                    reader.readAsText(file);
                }
            });
        }
    }
    else {
        workspace.style.display = "none";
        outputDiv.style.display = "block";
        optionsScreen.style.display = "none";
        document.querySelector("header").style.display = "none";

        const invisibleChar = '\u200B ';
        let inputText1 = invisibleChar + text1.value;
        let inputText2 = invisibleChar + text2.value;

        const considerComma = document.getElementById('considerComma').checked;
        const considerPeriod = document.getElementById('considerPeriod').checked;
        const considerCase = document.getElementById('considerCase').checked;
        const considerAllPunctuation = document.getElementById('considerAllPunctuation').checked;

        if (!considerAllPunctuation) {
            inputText1 = inputText1.replace(/[!"#$%&'()*+\-/:;<=>?@[\\\]^_`{|}~]/g, ' ');
            inputText2 = inputText2.replace(/[!"#$%&'()*+\-/:;<=>?@[\\\]^_`{|}~]/g, ' ');
        }
        if (!considerComma) {
            inputText1 = inputText1.replace(/,/g, ' ');
            inputText2 = inputText2.replace(/,/g, ' ');
        }
        if (!considerPeriod) {
            inputText1 = inputText1.replace(/\./g, ' ');
            inputText2 = inputText2.replace(/\./g, ' ');
        }
        if (!considerCase) {
            inputText1 = inputText1.toLowerCase();
            inputText2 = inputText2.toLowerCase();
        }

        var word1 = inputText1.trim().split(/\s+/);
        var word2 = inputText2.trim().split(/\s+/);
        var wordCount1 = word1.length;
        var wordCount2 = word2.length;
        var charCount1 = text1.value.length;
        var charCount2 = text2.value.length;
        var charWord1 = Math.round(charCount1 / 5);
        var charWord2 = Math.round(charCount2 / 5);
        var L = lcs(word2, word1);
        var redWords = L.redWords.slice().reverse();
        var blueWords = L.blueWords.slice().reverse();
        var red = redWords.length;
        var orangeWords = L.orangeWords.slice().reverse();
        var orange = orangeWords.length;
        var blue = blueWords.length;
        var fm = red + orange;
        var error = errorsPercentage(fm, blue, wordCount1);
        var cp = "Disabled";

        if (!submitButtonClicked && !autoClick) {
            timeTotal = timeTotal - timeLeft;
        }

        if (wordCount2 > 1 && charCount2 > 1 && !copyPaste) {
            var wpm = Math.round(wordCount2 / (timeTotal / 60));
            var cpm = Math.round(charWord2 / (timeTotal / 60));
        } else if (copyPaste) {
            wpm = cpm = "NA";
            cp = "Enabled";
        } else {
            wpm = cpm = "0"
        }

        document.querySelector('#result').innerHTML = `
            <div class="results-grid">
            <div class="result-card"><span>Typing Speed:</span><strong>${wpm} WPM (${cpm})</strong></div>
            <div class="result-card"><span>Error:</span><strong>${error}%</strong></div>
            <div class="result-card"><span>Full Mistakes:</span><strong>${fm}</strong></div>
            <div class="result-card"><span>Half Mistakes:</span><strong>${blue}</strong></div>
            <div class="result-card"><span>Total Words:</span><strong>${wordCount1 + ' (' + charWord1 + ')'}</strong></div>
            <div class="result-card"><span>Words Typed:</span><strong>${wordCount2 + ' (' + charWord2 + ')'}</strong></div>
            <div class="result-card"><span>Time Taken:</span><strong>${Math.floor(timeTotal / 60)}:${(timeTotal % 60).toString().padStart(2, '0')}</strong></div>
            <div class="result-card"><span>Copy-Paste:</span><strong>${cp}</strong></div>
            </div>`;

        // ================== Save result to local storage (via StenoDB) ==================
        try {
            if (window.StenoDB && typeof window.StenoDB.saveResult === 'function') {
                const userId = (StenoDB.getUserProfile && StenoDB.getUserProfile().id) || null;
                const resultToSave = {
                    id: 'result-' + Date.now(),
                    userId: userId,
                    date: new Date().toISOString(),
                    wpm: wpm === undefined ? null : wpm,
                    errorRate: error === undefined ? null : error,
                    fullMistakes: fm === undefined ? null : fm,
                    halfMistakes: blue === undefined ? null : blue,
                    totalWords: wordCount1 === undefined ? null : wordCount1,
                    wordsTyped: wordCount2 === undefined ? null : wordCount2,
                    timeTaken: timeTotal === undefined ? null : timeTotal,
                    copyPaste: copyPaste ? true : false,
                    dictationId: (typeof text1 !== 'undefined' && text1 && text1.name) ? text1.name : null
                };
                StenoDB.saveResult(resultToSave);
                // optional: console feedback
                console.log('Saved result to localStorage', resultToSave);
            } else {
                console.warn('StenoDB not available — result not saved.');
            }
        } catch (e) {
            console.error('Error saving result to localStorage', e);
        }
        // =======================================================================


        // output
        output.innerHTML = L.output + '<br>';
        submitButtonClicked = true;
        clearInterval(countdownInterval);
    }
});

const checkboxes = document.querySelectorAll('.checkbox-controls input[type="checkbox"]');
checkboxes.forEach(checkbox => {
    checkbox.addEventListener('change', () => {
        submit.click();
        clearInterval(countdownInterval);
    });
});

/*window.addEventListener("load", () => {
    showPopup(
        "Instructions",
        `<p>You must choose a dictation.</p>
       <p>After the dictation finishes, you will get <strong>10 minutes</strong> for reading.</p>
       <p>Then you will get <strong>50 minutes</strong> to transcribe.</p>`,
        () => {}
    );
});
*/


const disableCopyPasteHandler = e => {
    e.preventDefault()
    showPopup(
        "Operation Disabled",
        `<p>Enable copy-paste?</p>`,
        () => {
            ["paste", "copy", "cut"].forEach(evt => {
                text2.removeEventListener(evt, disableCopyPasteHandler);
            });
            copyPaste = true;
            console.log("Copy/paste is now enabled!");
        }
    );
};
["paste", "copy", "cut"].forEach(evt => {
    text2.addEventListener(evt, disableCopyPasteHandler);
});

document.querySelector(".collapse-header").addEventListener("click", function () {
    const content = document.querySelector(".collapse-content");
    const isOpen = content.style.display === "block";

    content.style.display = isOpen ? "none" : "block";
    this.textContent = isOpen ? "Instructions ▼" : "Instructions ▲";
});


function printResults() {
    const now = new Date();
    const fileTitle =
        "Steno" +
        now.getFullYear() + "" +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0") +
        String(now.getHours()).padStart(2, "0") +
        String(now.getMinutes()).padStart(2, "0");

    const originalTitle = document.title;
    document.title = fileTitle;

    window.print();

    setTimeout(() => {
        document.title = originalTitle;
    }, 1000);
}

function cleanMasterText(rawText) {
    let cleaned = rawText.replace(/\//g, ' ');
    cleaned = cleaned.replace(/\(\s*\d+\s*\)/g, ' ');
    cleaned = cleaned.replace(/\b[A-Z]{2,}\b/g, match => match.toLowerCase());
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned;
}

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener('keydown', function (event) {
        if ((event.ctrlKey || event.metaKey) && event.key === 'r') {
            event.preventDefault();
            restart.click()
        }
        if ((event.ctrlKey || event.metaKey) && event.key === 's') {
            event.preventDefault();
            printResults();
        }
    });
    const profileIcon = document.getElementById('profile-icon');
    profileIcon.src = StenoDB.getUserProfile().photo;
    if (profileIcon) {
        profileIcon.addEventListener('click', () => {
            if (!window.StenoDB) return;

            const profile = StenoDB.getUserProfile();
            const statsHTML = StenoDB.renderProgressHTML
                ? StenoDB.renderProgressHTML()
                : '<p>No stats available</p>';

            // Profile header
            document.getElementById('popup-title').innerHTML = `
            <div style="display:flex;align-items:center;gap:12px;">
            <img id="profile-photo" src="${profile.photo}" 
                style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-color);">
            <div>
            <div id="profile-name" style="font-weight:600;font-size:18px;">${profile.name}</div>
            <button id="edit-profile-btn" 
                    style="margin-top:4px;font-size:12px;border:1px solid var(--accent-color);background:none;border-radius:6px;padding:2px 6px;color:var(--accent-color);cursor:pointer;">Edit Profile</button>
            </div></div>`;

            // Stats content
            document.getElementById('popup-body').innerHTML = `<div id="stats-container">${statsHTML}</div>`;


            document.getElementById('popup').style.display = 'flex';
            popupOk.addEventListener('click', () => {
                document.getElementById('popup').style.display = 'none';
            });

            const editBtn = document.getElementById('edit-profile-btn');
            if (editBtn) {
                editBtn.addEventListener('click', () => {
                    document.getElementById('popup-title').innerHTML = `
              <div style="display:flex;flex-direction:column;align-items:center;text-align:center;">
                <img id="edit-photo-preview" src="${profile.photo}" 
                     style="width:80px;height:80px;border-radius:50%;object-fit:cover;border:2px solid var(--accent-color);margin-bottom:10px;">
                <input type="file" id="edit-photo-input" accept="image/*" style="margin-bottom:10px;">
                <input type="text" id="edit-name-input" value="${profile.name}" 
                       placeholder="Enter your name" 
                       style="padding:6px 10px;border:1px solid var(--accent-color);border-radius:6px;width:80%;max-width:240px;">
              </div>
            `;
                    const table = document.querySelector('#stats-container table');
                    if (!table) return;

                    const editing = table.dataset.editing === "true";
                    table.dataset.editing = editing ? "false" : "true";

                    if (!editing) {
                        table.querySelectorAll('tbody tr').forEach((row, i) => {
                            const id = (StenoDB.readAllResults().slice().reverse()[i] || {}).id;
                            if (!id) return;
                            const delBtn = document.createElement('button');
                            delBtn.textContent = '✕';
                            delBtn.style.cssText = 'margin-left:8px;color:#fff;background:#b22222;border:none;border-radius:4px;cursor:pointer;padding:2px 6px;';
                            delBtn.addEventListener('click', () => {
                                if (confirm('Delete this record?')) {
                                    StenoDB.deleteResultById(id);
                                    row.remove();
                                }
                            });
                            const lastCell = row.lastElementChild;
                            lastCell.appendChild(delBtn);
                        });
                    } else {
                        document.getElementById('stats-container').innerHTML = StenoDB.renderProgressHTML();
                    }

                    popupOk.addEventListener('click', () => {

                        const nameInput = document.getElementById('edit-name-input');
                        const fileInput = document.getElementById('edit-photo-input');
                        const newName = nameInput.value.trim() || profile.name;

                        let updates = { name: newName };
                        console.log(updates);
                        profileIcon.click();

                        const file = fileInput.files[0];
                        if (file) {
                            const reader = new FileReader();
                            reader.onload = ev => {
                                updates.photo = ev.target.result;
                                StenoDB.updateUserProfile(updates);
                                profileIcon.src = updates.photo;
                            };
                            reader.readAsDataURL(file);
                        } else {
                            StenoDB.updateUserProfile(updates);
                        }
                    });
                });
            }
        });
    }
});
