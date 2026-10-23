// ROOMTOUR demo, Ukrainian: a public GitHub repository page, seen by a visitor who is not signed in.
// Captured 2026-10-22 from https://github.com/anthropics/claude-code at 1280 px, 1:1.
Roomtour.define(({ ui, chip, note }) => ({
  public: true, // a public page captured signed out, so its screenshot may live in git
  lang: 'uk',
  uiLang: 'en',
  title: 'Сторінка репозиторію на GitHub',
  subtitle: 'демо ROOMTOUR',
  foot: 'Знято 22 жовтня 2026 року з github.com/anthropics/claude-code без входу в акаунт, ширина 1280 px. Фото учасників розмиті.',

  // Категорії обирають під кожну задачу, від найбезпечнішої. Тут: що може зробити відвідувач без акаунта.
  categories: {
    look:    { label: 'Можна дивитися',  note: 'відкриває або показує, нічого не змінює',      tone: 'green', icon: 'eye',   line: 'solid' },
    account: { label: 'Потрібен акаунт', note: 'спершу просить увійти',                         tone: 'blue',  icon: 'lock',  line: 'dotted' },
    public:  { label: 'Побачать інші',   note: 'залишає публічний слід під твоїм іменем',       tone: 'amber', icon: 'users', line: 'dashed' }
  },

  scenes: {
    repo: { src: 'shots/repo.png', w: 1280, h: 1300, alt: 'Головна сторінка публічного репозиторію на GitHub' }
  },

  chapters: [
    { id: 'intro', name: 'Початок' },
    { id: 'top',   name: 'Верх сторінки' },
    { id: 'files', name: 'Файли' },
    { id: 'side',  name: 'Права колонка' },
    { id: 'end',   name: 'Шпаргалка' }
  ],

  steps: [
    { ch: 'intro', scene: 'repo', r: null, t: 'Репозиторій — це тека проєкту з пам’яттю',
      b: `<p>Уяви спільну теку, яка зберігає історію змін і того, хто їх зробив. Це і є репозиторій, або репо.</p>
          <p>Ця сторінка — вхідні двері репо. Пройдемо її зона за зоною.</p>
          <p>Категорія зони каже, що зробить клік:</p>
          <ul class="key">
            <li>${chip('look')}<span>відкриває або показує, нічого не змінює</span></li>
            <li>${chip('account')}<span>спершу просить увійти</span></li>
            <li>${chip('public')}<span>залишає публічний слід під твоїм іменем</span></li>
          </ul>
          <p>Гортай кнопками внизу або стрілками на клавіатурі.</p>` },

    { ch: 'top', scene: 'repo', r: [0, 0, 1280, 72], k: 'look', t: 'Смуга самого GitHub',
      b: `<p>Ця чорна смуга однакова на сторінках GitHub для відвідувачів без входу. Меню в ній — про сам GitHub, а не про цей проєкт.</p>` },
    { ch: 'top', scene: 'repo', r: [1051, 20, 157, 32], k: 'account', t: 'Sign in і Sign up',
      b: `<p>${ui('Sign in')} — увійти в акаунт, ${ui('Sign up')} — створити його.</p>
          <p>Без акаунта тут можна читати сторінку й відкривати файли. Будь-яка дія спершу просить увійти.</p>` },
    { ch: 'top', scene: 'repo', r: [22, 92, 190, 24], k: 'look', mb: 't', t: 'Чий це проєкт',
      b: `<p>${ui('anthropics')} — власник: компанія або людина. ${ui('claude-code')} — назва проєкту.</p>
          <p>Разом вони дають адресу: github.com/anthropics/claude-code.</p>` },
    { ch: 'top', scene: 'repo', r: [0, 124, 1280, 48], k: 'look', t: 'Вкладки проєкту',
      b: `<ul class="plain">
            <li>${ui('Code')} — файли. Ми тут.</li>
            <li>${ui('Issues')} — повідомлення про помилки та ідеї, тут понад 5000.</li>
            <li>${ui('Pull requests')} — запропоновані зміни, що чекають на перевірку.</li>
            <li>${ui('Actions')} — автоматичні перевірки змін.</li>
          </ul>
          <p>Число біля вкладки — скільки в ній відкритих записів.</p>` },
    { ch: 'top', scene: 'repo', r: [32, 190, 210, 32], k: 'look', t: 'Назва і Public',
      b: `<p>${ui('Public')} означає, що проєкт бачить будь-хто в інтернеті. Закритий проєкт показав би ${ui('Private')} і замок.</p>` },
    { ch: 'top', scene: 'repo', r: [896, 192, 353, 28], k: 'public', mb: 't', t: 'Notifications, Fork, Star',
      from: ['screen',
             'docs:https://docs.github.com/en/account-and-profile/managing-subscriptions-and-notifications-on-github/setting-up-notifications/about-notifications#:~:text=You%20can%20choose%20to%20view%20your%20notifications',
             'docs:https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/working-with-forks/fork-a-repo#:~:text=Forking%20a%20repository%20lets%20you%20propose%20changes',
             'docs:https://docs.github.com/en/get-started/exploring-projects-on-github/saving-repositories-with-stars#:~:text=You%20can%20view%20everyone%20who%20has%20starred'],
      b: `<ul class="plain">
            <li>${ui('Notifications')} — отримувати новини про цей проєкт на GitHub або листом.</li>
            <li>${ui('Fork')} — зробити собі копію, щоб пробувати зміни, не чіпаючи оригінал.</li>
            <li>${ui('Star')} — публічна закладка. Число показує, скільки людей її поставили.</li>
          </ul>
          <p>Усі три потребують акаунта. Зірки публічні: будь-хто бачить, хто поставив зірку репозиторію. Форк стає репозиторієм у твоєму акаунті.</p>` },

    { ch: 'files', scene: 'repo', r: [32, 265, 106, 32], k: 'look', mb: 'l', t: 'Гілка main',
      b: `<p>Гілка — паралельна версія проєкту, як копія макета, щоб спробувати ідею.</p>
          <p>${ui('main')} — головна версія. Меню перемикає на іншу гілку лише для перегляду.</p>` },
    { ch: 'files', scene: 'repo', r: [146, 265, 219, 32], k: 'look', t: 'Branches і Tags',
      b: `<p>${ui('216 Branches')} — скільки є паралельних версій. ${ui('255 Tags')} — іменовані моменти, зазвичай релізи на кшталт 1.0 чи 2.0.</p>` },
    { ch: 'files', scene: 'repo', r: [615, 265, 203, 32], k: 'look', t: 'Go to file',
      b: `<p>Пошук файла за назвою. Швидше, ніж клацати теками.</p>` },
    { ch: 'files', scene: 'repo', r: [827, 265, 109, 32], k: 'look', mb: 't', t: 'Зелена кнопка Code',
      b: `<p>Попри колір, вона безпечна. Вона показує, як завантажити проєкт: посиланням для розробників або zip-файлом.</p>` },
    { ch: 'files', scene: 'repo', r: [33, 314, 903, 53], k: 'look', t: 'Останнє збереження',
      b: `<p>Збереження проєкту називається комітом. Цей рядок показує останній: хто зберіг, що написав і коли.</p>
          <p>${ui('939 Commits')} праворуч відкриває всю історію збережень.</p>` },
    { ch: 'files', scene: 'repo', r: [32, 367, 904, 779], k: 'look', t: 'Теки і файли',
      b: `<p>Ліворуч — теки та файли. Посередині — нотатка з останнього збереження, яке їх зачепило. Праворуч — як давно.</p>
          <p>Клік відкриває теку або файл для читання.</p>` },
    { ch: 'files', scene: 'repo', r: [33, 1163, 903, 48], k: 'look', t: 'README, License, Security',
      b: `<p>${ui('README')} — текст на першій сторінці проєкту: що це і як почати. ${ui('License')} каже, що можна робити з кодом. ${ui('Security')} — як повідомити про вразливість.</p>` },

    { ch: 'side', scene: 'repo', r: [976, 265, 272, 240], k: 'look', t: 'About',
      b: `<p>Один абзац про те, що робить проєкт, і посилання на документацію.</p>` },
    { ch: 'side', scene: 'repo', r: [976, 660, 130, 80], k: 'look', mb: 'r', t: 'Зірки, спостерігачі, форки',
      b: `<p>Три лічильники популярності: скільки людей поставили проєкту зірку, стежать за ним і зробили форк.</p>
          ${note('Варто знати.', 'Великі числа означають, що проєктом користуються багато людей, а не те, що в коді немає помилок.')}` },
    { ch: 'side', scene: 'repo', r: [976, 783, 272, 214], k: 'look', mb: 'r', t: 'Contributors',
      b: `<p>Люди, які змінювали проєкт. У цьому демо їхні фото розмиті: тур показує інтерфейс, а не людей.</p>` },
    { ch: 'side', scene: 'repo', r: [976, 997, 272, 127], k: 'look', mb: 'r', t: 'Languages',
      b: `<p>Якими мовами програмування написано код і в якій пропорції. Тут переважно TypeScript і Python.</p>` },

    { ch: 'end', scene: 'repo', r: null, map: true, t: 'Шпаргалка',
      b: `<h3>${chip('look')}</h3>
          <p>Майже вся сторінка: вкладки, гілки, список файлів, README, права колонка і навіть зелена кнопка Code.</p>
          <h3>${chip('account')}</h3>
          <p>${ui('Sign in')} і ${ui('Sign up')}. Будь-яка інша дія теж спершу просить увійти.</p>
          <h3>${chip('public')}</h3>
          <p>${ui('Notifications')}, ${ui('Fork')} і ${ui('Star')}. Зірки публічні, а форк стає репозиторієм у твоєму акаунті.</p>` }
  ]
}));
