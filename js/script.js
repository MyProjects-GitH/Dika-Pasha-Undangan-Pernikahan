const weddingDate = new Date("2026-11-22T08:00:00+07:00");
const hostWhatsAppNumber = "";
const toast = document.getElementById("toast");
let toastTimeout;

function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.clearTimeout(toastTimeout);
    toastTimeout = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function updateCountdown() {
    const remaining = weddingDate.getTime() - Date.now();
    const values = remaining <= 0
        ? [0, 0, 0, 0]
        : [
            Math.floor(remaining / 86400000),
            Math.floor((remaining % 86400000) / 3600000),
            Math.floor((remaining % 3600000) / 60000),
            Math.floor((remaining % 60000) / 1000)
        ];
    ["days", "hours", "minutes", "seconds"].forEach((id, index) => {
        document.getElementById(id).textContent = String(values[index]).padStart(2, "0");
    });
}

updateCountdown();
window.setInterval(updateCountdown, 1000);

document.getElementById("open-invitation").addEventListener("click", () => {
    document.getElementById("pembuka").scrollIntoView({ behavior: "smooth" });
});

document.getElementById("calendar-button").addEventListener("click", () => {
    const start = "20270516T010000Z";
    const end = "20270516T070000Z";
    const calendar = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Alya dan Raka//Undangan Pernikahan//ID",
        "BEGIN:VEVENT",
        `DTSTART:${start}`,
        `DTEND:${end}`,
        "SUMMARY:Pernikahan Alya dan Raka",
        "LOCATION:The Garden Hall\\, Jl. Pahlawan No. 21\\, Bandung",
        "DESCRIPTION:Akad nikah pukul 08.00 WIB dan resepsi pukul 11.00 WIB.",
        "END:VEVENT",
        "END:VCALENDAR"
    ].join("\r\n");
    const url = URL.createObjectURL(new Blob([calendar], { type: "text/calendar;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "undangan-alya-raka.ics";
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Jadwal pernikahan berhasil ditambahkan ke unduhan kalender.");
});

const storageKeys = {
    rsvp: "alya-raka-rsvp",
    wishes: "alya-raka-wishes"
};

function setupFormPicker(pickerId, initialValue, initialText) {
    const picker = document.getElementById(pickerId);
    const trigger = picker.querySelector(".form-picker-trigger");
    const valueInput = picker.querySelector('input[type="hidden"]');
    const display = picker.querySelector(".form-picker-display");
    const optionsList = picker.querySelector(".form-picker-options");
    const options = Array.from(optionsList.querySelectorAll(".form-picker-option"));

    function closeOptions() {
        optionsList.hidden = true;
        trigger.setAttribute("aria-expanded", "false");
    }

    function reset() {
        valueInput.value = initialValue;
        display.textContent = initialText;
        options.forEach((option) => {
            option.setAttribute("aria-selected", String(option.dataset.value === initialValue));
        });
        closeOptions();
    }

    trigger.addEventListener("click", () => {
        const opening = optionsList.hidden;
        optionsList.hidden = !opening;
        trigger.setAttribute("aria-expanded", String(opening));
        if (opening) {
            const selectedOption = options.find((option) => option.dataset.value === valueInput.value);
            (selectedOption || options[0]).focus();
        }
    });

    options.forEach((option, index) => {
        option.addEventListener("click", () => {
            valueInput.value = option.dataset.value;
            display.textContent = option.textContent.trim();
            options.forEach((item) => item.setAttribute("aria-selected", String(item === option)));
            closeOptions();
            trigger.focus();
        });

        option.addEventListener("keydown", (event) => {
            let nextIndex = index;
            if (event.key === "ArrowDown") nextIndex = (index + 1) % options.length;
            else if (event.key === "ArrowUp") nextIndex = (index - 1 + options.length) % options.length;
            else if (event.key === "Home") nextIndex = 0;
            else if (event.key === "End") nextIndex = options.length - 1;
            else if (event.key === "Escape") {
                closeOptions();
                trigger.focus();
                return;
            } else if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                option.click();
                return;
            } else {
                return;
            }
            event.preventDefault();
            options[nextIndex].focus();
        });
    });

    document.addEventListener("click", (event) => {
        if (!picker.contains(event.target)) closeOptions();
    });

    reset();
    return { valueInput, reset };
}

const attendancePicker = setupFormPicker("rsvp-attendance-picker", "", "Pilih konfirmasi");
const guestsPicker = setupFormPicker("rsvp-guests-picker", "1", "1 orang");

document.getElementById("rsvp-form").addEventListener("submit", (event) => {
    event.preventDefault();
    if (!attendancePicker.valueInput.value) {
        showToast("Silakan pilih konfirmasi kehadiran.");
        document.getElementById("rsvp-attendance-trigger").focus();
        return;
    }
    const formData = new FormData(event.currentTarget);
    const response = {
        name: String(formData.get("name")).trim(),
        attendance: String(formData.get("attendance")),
        guests: String(formData.get("guests"))
    };
    const responses = JSON.parse(localStorage.getItem(storageKeys.rsvp) || "[]");
    responses.push(response);
    localStorage.setItem(storageKeys.rsvp, JSON.stringify(responses));
    event.currentTarget.reset();
    attendancePicker.reset();
    guestsPicker.reset();
    if (/^\d{8,15}$/.test(hostWhatsAppNumber)) {
        const message = `Konfirmasi undangan Alya & Raka\nNama: ${response.name}\nKehadiran: ${response.attendance}\nJumlah tamu: ${response.guests}`;
        window.open(`https://wa.me/${hostWhatsAppNumber}?text=${encodeURIComponent(message)}`, "_blank", "noopener,noreferrer");
        showToast("Konfirmasi tersimpan. WhatsApp dibuka untuk mengirimkannya kepada tuan rumah.");
    } else {
        showToast("Konfirmasi tersimpan di perangkat ini. Atur nomor WhatsApp tuan rumah di js/script.js agar dapat dikirim.");
    }
});

function renderWishes() {
    const list = document.getElementById("wish-list");
    const wishes = JSON.parse(localStorage.getItem(storageKeys.wishes) || "[]");
    list.replaceChildren();

    if (wishes.length === 0) {
        const empty = document.createElement("p");
        empty.className = "empty-wishes";
        empty.textContent = "Jadilah yang pertama mengirimkan doa.";
        list.append(empty);
        return;
    }

    wishes.slice(-8).reverse().forEach((wish) => {
        const entry = document.createElement("article");
        entry.className = "wish-entry";
        const name = document.createElement("strong");
        const message = document.createElement("p");
        name.textContent = wish.name;
        message.textContent = wish.message;
        entry.append(name, message);
        list.append(entry);
    });
}

document.getElementById("wish-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const wishes = JSON.parse(localStorage.getItem(storageKeys.wishes) || "[]");
    wishes.push({
        name: String(formData.get("name")).trim(),
        message: String(formData.get("message")).trim()
    });
    localStorage.setItem(storageKeys.wishes, JSON.stringify(wishes));
    event.currentTarget.reset();
    renderWishes();
    showToast("Ucapan dan doa Anda berhasil ditambahkan.");
});

renderWishes();

document.querySelectorAll(".copy-button").forEach((button) => {
    button.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(button.dataset.copy);
            showToast("Berhasil disalin ke clipboard.");
        } catch (error) {
            showToast("Clipboard tidak tersedia di browser ini. Silakan salin secara manual.");
        }
    });
});

let audioContext;
let musicTimer;
let noteIndex = 0;
const musicNotes = [261.63, 329.63, 392, 329.63, 293.66, 349.23, 440, 349.23];
const musicButton = document.getElementById("music-toggle");

function playSoftNote() {
    if (!audioContext || audioContext.state !== "running") return;
    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = "sine";
    oscillator.frequency.value = musicNotes[noteIndex % musicNotes.length];
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(0.035, now + 0.3);
    volume.gain.exponentialRampToValueAtTime(0.0001, now + 2.4);
    oscillator.connect(volume);
    volume.connect(audioContext.destination);
    oscillator.start(now);
    oscillator.stop(now + 2.5);
    noteIndex += 1;
}

musicButton.addEventListener("click", async () => {
    if (musicTimer) {
        window.clearInterval(musicTimer);
        musicTimer = undefined;
        musicButton.setAttribute("aria-pressed", "false");
        musicButton.setAttribute("aria-label", "Nyalakan musik");
        showToast("Musik dimatikan.");
        return;
    }
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) {
        showToast("Browser ini belum mendukung pemutar musik.");
        return;
    }
    audioContext = audioContext || new AudioContext();
    await audioContext.resume();
    playSoftNote();
    musicTimer = window.setInterval(playSoftNote, 1800);
    musicButton.setAttribute("aria-pressed", "true");
    musicButton.setAttribute("aria-label", "Matikan musik");
    showToast("Musik latar dinyalakan.");
});