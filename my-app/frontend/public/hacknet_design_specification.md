# Дизайн-система та UI/UX Специфікація
## Проєкт: HackNet: Dark Web Contractor

---

## 1. Концепція та UI/UX Філософія

**Основна ідея:** Інтерфейс імітує кастомну хакерську операційну систему "HackNet OS v1.0", що працює всередині анонімної мережі DarkWeb.
**Стиль:** Cyberpunk / Hacker Terminal / Retro-Futurism.
**Ключові ефекти:** Neon Glow, CRT-сканлінії, моноширинні шрифти, темно-вугільні фони з контрастними неоновими акцентами (зелений, кібер-пурпуровий, тривожний червоний/янтарний).

---

## 2. Колірна Палітра (Color Palette)

### 2.1. Основні CSS-змінні
```css
:root {
  /* Backgrounds */
  --bg-main: #0a0d14;          /* Deep Cyber Black */
  --bg-surface: #121824;       /* Terminal Panel Dark */
  --bg-surface-hover: #1b2334; /* Panel Hover State */
  --bg-overlay: rgba(10, 13, 20, 0.85);

  /* Primary Cyber Accents */
  --accent-green: #00ff66;     /* Terminal Success / Active Matrix */
  --accent-green-glow: rgba(0, 255, 102, 0.4);
  --accent-cyan: #00f0ff;      /* System Info / Links */
  --accent-purple: #9d4edd;    /* DarkWeb Marketplace / Premium */
  --accent-amber: #ffaa00;     /* Warning / Suspicious activity */
  --accent-red: #ff2a6d;       /* Alert / Access Denied / Error */

  /* Text Colors */
  --text-main: #e0e6ed;        /* High contrast text */
  --text-muted: #6272a4;       /* Dimmed details / Comments */
  --text-code: #00ff66;        /* Monospace code color */

  /* Borders & Grid */
  --border-color: #232d42;
  --border-active: #00ff66;
  --grid-line: rgba(0, 240, 255, 0.05);
}
```

---

## 3. Типографіка (Typography)

* **Основний шрифт інтерфейсу (UI & Headers):** `Fira Code`, `JetBrains Mono`, або `Source Code Pro` (Monospace).
* **Шрифт для акцентів та заголовків екранів:** `Share Tech Mono` або `VT323`.

```css
/* Налаштування шрифтів */
body {
  font-family: 'JetBrains Mono', monospace;
  background-color: var(--bg-main);
  color: var(--text-main);
  letter-spacing: -0.02em;
}

h1, h2, h3 {
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-shadow: 0 0 8px var(--accent-green-glow);
}
```

---

## 4. Спеціальні Візуальні Ефекти (FX)

### 4.1. CRT-Ефект сканування (Scanlines)
Overlay поверх усього екрана для створення відчуття старого CRT-монітора.
```css
.crt-overlay {
  position: fixed;
  top: 0; left: 0; width: 100vw; height: 100vh;
  background: linear-gradient(
    rgba(18, 16, 16, 0) 50%, 
    rgba(0, 0, 0, 0.25) 50%
  );
  background-size: 100% 4px;
  z-index: 9999;
  pointer-events: none;
  opacity: 0.6;
}
```

### 4.2. Неонове Світіння (Glow)
```css
.glow-green {
  box-shadow: 0 0 15px var(--accent-green-glow);
  border: 1px solid var(--accent-green);
}

.glow-text-cyan {
  text-shadow: 0 0 10px var(--accent-cyan);
}
```

### 4.3. Кастомний Скроллбар
```css
::-webkit-scrollbar {
  width: 6px;
}
::-webkit-scrollbar-track {
  background: var(--bg-main);
}
::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 2px;
}
::-webkit-scrollbar-thumb:hover {
  background: var(--accent-green);
}
```

---

## 5. UI-Компоненти та Модулі

### 5.1. Хедер та Панель Статусу (Top Navigation Bar)
* **Стиль:** Темна плашка у верхній частині екрана з тонкою неоновою лінією знизу.
* **Елементи:**
  * **Логотип:** `[HackNet OS v1.0]` (зелений пульсуючий індикатор біля назви).
  * **Профіль:** Нікнейм агента + Аватар у вигляді ASCII-арту або кібер-іконки.
  * **Статистика:**
    * Баланс: `$ 12,450 BTC` (колір: gold/amber).
    * Статус мережі: `CONNECTED [TOR NODE #849]` (колір: green).
    * Кнопка `[LOGOUT / DISCONNECT]`.

### 5.2. Екран Авторизації / Реєстрації (Auth Screen)
* **Центральний блок:** Вікно термінала з діалогом автентифікації.
* **Анімація:** Ефект "політерного вводу" (Typing effect) під час завантаження підказок.
* **Поля вводу:**
  * Темні інпути з зеленим каретом (курсором).
  * Рамка стає яскраво-зеленою при фокусі.
  * Пароль відображається у вигляді зірочок або хаотичних символів при фокусі.

### 5.3. Дашборд Контрактів (DarkWeb Marketplace)
* **Сітка (Grid Layout):** 2x2 картки завдань.
* **Стиль Картки Контракту:**
  * Темний прямокутник із закругленням `4px` або зрізаними кутами (clip-path).
  * **Шапка картки:** Номер контракту, Назва, Нагорода (напр. `$ 1,500`), Складність (`[EASY]`, `[MEDIUM]`, `[HARD]`).
  * **Статус:** `[AVAILABLE]`, `[IN PROGRESS]`, `[COMPLETED]`.
  * **Ефект при наведенні:** Плане підвищення картки, яскрава неонова рамка, звук "кліку" або "гудіння" (опціонально).

---

## 6. Дизайн Та Стилізація Ігрових Модулів (Лабораторні 1-4)

### 6.1. Контракт #1: Частотний Аналіз (Frequency Analyzer)
* **Верстка:** Двоколонкова.
  * **Ліворуч:** Вікно зашифрованого листування з текстовим полем та слайдером ключа $K$.
  * **Праворуч:** Гістограма частот (Recharts / Chart.js).
* **Стилізація Графіка:**
  * Стовпчики перехопленого тексту: **Червоні / Янтарні** (збій / шифр).
  * Стовпчики еталонної мови (UA/EN): **Зелені / Напівпрозорі**.
  * Плавна анімація зміни висоти стовпчиків при сортуванні чи зміні ключа.

### 6.2. Контракт #2: JWT Inspector & Exploit Console
* **Стиль:** Натхненний jwt.io, але у темному хакерському інтерфейсі.
* **Кольорове розбиття JWT:**
  * `Header`: Рожевий / Червоний (`#ff2a6d`).
  * `Payload`: Пурпуровий / Фіолетовий (`#9d4edd`).
  * `Signature`: Синій / Ціан (`#00f0ff`).
* **Консоль Експлойту:** Інтерактивний JSON-редактор. При зміні `"role": "user"` на `"role": "admin"` поле підсвічується червоним сяйвом до моменту перепідпису токена.

### 6.3. Контракт #3: S-DES Feistel Inspector
* **Концепція:** Схема бітових перетворень та інспекція процесу шифрування.
* **UI Елементи:**
  * **Блок бітів:** 8 осередків (кожен біт 0 або 1 у вигляді стилізованої кнопки-тумблера).
  * **Схема мережі Фейстеля:** Інтерактивна діаграма з блоками $P10, P8, IP, Fk, S0, S1, SW, IP^{-1}$.
  * **Анімація:** При переході між кроками відповідний блок на схемі засвічується **зеленим сяйвом**, а біти "перелітають" або змінюють свої значення.

### 6.4. Контракт #4: Diffie-Hellman & MITM Interceptor
* **Концепція:** Інтерактивна карта перехоплення мережевого трафіку.
* **UI Елементи:**
  * **Три вузли (Nodes):**
    1. `Alice Node` (Ліворуч) — Блакитний колір.
    2. `Bob Node` (Праворуч) — Блакитний колір.
    3. `Attacker / MITM Node` (Центр, вгорі) — Яскраво-червоний колір з анімованим пульсуючим радаром.
  * **Лінії зв'язку:** Анімовані пунктирні лінії трафіку. При перехопленні трафіку лінія "розривається" і перенаправляється через вузол нападника.

---

## 7. Кнопки, Інпути та Інтерактивні Елементи

### 7.1. Кнопки (Buttons)
```css
.btn-cyber {
  background: transparent;
  border: 1px solid var(--accent-green);
  color: var(--accent-green);
  padding: 10px 20px;
  font-family: 'JetBrains Mono', monospace;
  font-weight: bold;
  text-transform: uppercase;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  position: relative;
  overflow: hidden;
}

.btn-cyber:hover {
  background: var(--accent-green);
  color: var(--bg-main);
  box-shadow: 0 0 15px var(--accent-green-glow);
}

.btn-cyber-danger {
  border-color: var(--accent-red);
  color: var(--accent-red);
}

.btn-cyber-danger:hover {
  background: var(--accent-red);
  color: #fff;
  box-shadow: 0 0 15px rgba(255, 42, 109, 0.5);
}
```

### 7.2. Повідомлення про успіх / помилку (Toast Alerts)
* **Success Toast:** Зелена рамка, зелена іконка `[SUCCESS]`, звук підтвердження.
* **Error Toast:** Червона рамка, анімація легкого "дрижання" (shake animation), іконка `[ACCESS DENIED]`.

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-5px); }
  40%, 80% { transform: translateX(5px); }
}
.toast-error {
  animation: shake 0.4s ease-in-out;
  border-left: 4px solid var(--accent-red);
  background: var(--bg-surface);
}
```

---

## 8. Адаптивність та Чуйність (Responsive Design)

* **Десктоп (основний цільовий розділ):** Повноцінний дво- або триколонковий інтерфейс термінала з деталізованими графіками та інспекторами.
* **Планшет / Мобільний:**
  * Перехід у одноколонковий режим.
  * Панель навігації ховається в свідчину ("hamburger menu" у вигляді термінальної команди `[MENU]`).
  * Графіки та схемотехніка S-DES переходять у режим горизонтальної прокрутки (overflow-x auto).