# DES-1054 · DeoVR Cancellation flow — прототип

Задача: https://realitystream.atlassian.net/browse/DES-1054
Артефакт для ревью: https://claude.ai/artifact/1ib8RGXxv54Z9toLKUCyAU
Макеты-черновики (по образцу SLR): Figma `DEO New`, секция «Cancel Plan_SLR type» (`41523:591894`).

Файлы: `index.html` (разметка), `proto.css` (стили, токены), `proto.js` (логика флоу), `icons.svg` (подмножество спрайта DeoVR), `logo.svg` / `logo-dark.svg`.
Страница профиля (`/profile`) как живой сайт + модалка отмены подписки.
Панель «PROTO» в правом нижнем углу — только для прототипа, не часть интерфейса. Горячие клавиши: `P` — панель, `Esc` — закрыть модалку.

## Что показано

Флоу (2–4 экрана, зависит от условий бэкенда):

1. **Thinking of leaving?** — всегда. Карточка плана (название, цена, дата окончания доступа, копи «If you cancel, you'll keep Premium until {date} and won't be charged again.»), блоки «Here's everything that's already yours» (до 3 персональных + общие, всего 5; состояние без персональных и с длинными числами — через панель). Кнопки: Keep My Access (primary), Continue Cancellation (secondary).
2. **Try the DeoVR app** — только если юзер не заходил в приложение. Лид + hero + два инфо-блока. Кнопки: Get the DeoVR App (primary), Continue Cancellation (secondary). Keep My Access здесь нет (по ТЗ).
3. **Your Drive storage** — только если не загружал видео в Drive. Та же раскладка, что экран 2: блок про 30 GB и блок с двумя AI-плагинами (Passthrough AI, Sync AI) с подписью «paid separately with tokens», чтобы не читались как часть Premium. Кнопки: Open DeoVR Drive (primary), Continue Cancellation (secondary).
4. **Why are you cancelling?** — всегда, здесь подтверждение. Radio (одиночный выбор), порядок перемешивается при каждом открытии, «Other» всегда последний; при выборе Other появляется textarea. Кнопки: Confirm Cancellation (главная, доступна без выбора причины), Keep My Access (secondary). Состояния: loading на Confirm, ошибка (панель → Confirm result: Error).

После отмены: модалка закрывается, тост «Your subscription is cancelled. You have Premium until {date}», карточка подписки в профиле переходит в состояние **Cancelled** (бейдж рядом с «Current plan:», «Access until», кнопка Reactivate). Keep My Access → тост «Your Premium stays active».

Шапка модалки: X справа на всех экранах, стрелка назад слева со второго экрана. Индикатор прогресса — полоски, их количество = число реально показанных экранов (пропущенные 2/3 не ломают его); отключается в панели, если решим убрать. Отступ под шапкой 24px (20 header + 4 body, как в `ModalService`), высота модалки по контенту.

Темы: light (дефолт) / dark. Брейкпоинты: 1440, 768, 360 (на мобиле модалка — bottom sheet, как `ModalService` при `< 480`).

## Из кода (frontend-shared / deovr-frontend)

| Что | Откуда |
|---|---|
| Кнопки (primary brand / primary negative / secondary neutral / ghost icon-button, md 44, loading-спиннер, focus-ring) | `frontend-shared/src/design-system/components/NewButton/NewButton.scss`, `IconButton` |
| Модалка: backdrop blur 12 + scrim, header 24/24/20, title heading-3, кнопки back/close, bottom sheet < 480, max-height 720 | `frontend-shared/src/features/modal-service/ModalService.module.scss`, `deovr-frontend/src/features/modal/Modal.module.scss` |
| Карточка плана в модалке (градиент, heading, actions 2 колонки > 480) | `deovr-frontend/src/pages/ProfilePage/components/CancelConfirmationModal/CancelConfirmationModal.module.scss` |
| Карточка подписки в профиле (`Benefits`), UserInfo, заголовок страницы | `deovr-frontend/src/pages/ProfilePage/**` |
| Radio 20px, 1px `stroke-selectors`, checked 2px + точка 10px | `frontend-shared/src/design-system/components/Radio/Radio.scss` |
| Textarea: заливка `fillSubtleNeutral`, тень `$inputShadow`, focus 2px `borderFocus` | по `new-inputs/TextField/TextField.module.scss` (сам Textarea в new-DS не реализован, см. «Новое») |
| Тосты: radius 16, тень, tinted-фон, иконка 32/20 | `frontend-shared/src/design-system/components/NewNotification/NewNotification.module.scss` |
| Токены цвета/радиусов/размеров кнопок (light) | `frontend-shared/src/design-system/styles/semantic/_deovr-theme.scss`, `primitives/radius/_deovr.scss`, `primitives/button-sizes/_deovr.scss` |
| Шапка, сайдбар 216px, логотип | `deovr-frontend/src/layouts/HeaderLayout`, `src/assets/logo.svg` |
| Иконки | спрайт `deovr-frontend/src/components/Icon/assets/icons.svg` (только существующие имена) |

## Новое / чего нет в коде

- **Dark-тема.** В `_deovr-theme.scss` только light. Dark-значения взяты из Figma-снапшота DeoVR Dark (`#080a0c` база, `#0d6cfc` brand, `#11161b` поверхность модалки). Если будем делать dark — нужен dark-бандл токенов.
- **Hero-графика экранов 2 и 3** — CSS-заглушки в бренд-цветах (градиент + иконка из спрайта). По ТЗ нужны настоящие ассеты для обеих тем с мобильными кропами — отдельная задача на графику.
- **Инфо-блоки** (бенефиты на экране 1, блоки под hero на 2–3) — единая плоская подложка `backgroundSecondary` (в dark — `backgroundTertiary`), radius 12, без обводки, иконка 20px из спрайта. Специально не похожи на кнопки/чипы. Компонента Chips в Web DS нет.
- **Textarea** в new-DS не реализован — стили повторяют `TextField`, radius 16 (у однострочного инпута 20).
- **Бейдж «Cancelled»** на карточке подписки — pill на `backgroundTintedNegative` / `contentNegative`, стоит в строке «Current plan:».
- **Confirm Cancellation** сделан `primary negative` (как сейчас в `CancelConfirmationModal.tsx`), а не brand-синим, как в черновике. Легко поменять.
- Иконки Sync AI/scripts в спрайте нет — использована `sparkles`.

## Открытые вопросы (из задачи)

- Экраны app и Drive отдельно (как здесь) или один «You haven't tried these yet» с двумя карточками?
- Оставляем ли индикатор прогресса (здесь — адаптивные полоски, выключаемые).
- Нужен ли отдельный копи для годовых планов и триала на экране 1 (панель → Plan: Annual показывает цену «per year»).
- Куда ведёт «Get the DeoVR App».
- Финальный список бенефитов — после ответа бэкенда.
