/* Additional interface languages: ES, FR, UK, RU. */
(() => {
const langs=['es','fr','uk','ru'];
const data=`skip|Ir al contenido|Aller au contenu|До вмісту|К содержимому
language|Idioma|Langue|Мова|Язык
shortTab|Acortar enlaces|Liens courts|Скорочення посилань|Сокращение ссылок
qrTab|Generador QR|Générateur QR|Генератор QR|Генератор QR
imageTab|Imagen → URL|Image → URL|Зображення → URL|Изображение → URL
inputHeading|Tu dirección|Votre adresse|Ваша адреса|Ваш адрес
outputHeading|Listo para compartir|Prêt à partager|Готово до поширення|Готово к отправке
urlLabel|Dirección web|Adresse du site|Адреса сайту|Адрес сайта
hint|Pega una dirección https:// o un dominio. Máximo 2048 caracteres.|Collez une adresse https:// ou un domaine. Maximum 2048 caractères.|Вставте адресу https:// або домен. Максимум 2048 символів.|Вставьте адрес https:// или домен. Максимум 2048 символов.
size|Tamaño PNG|Taille PNG|Розмір PNG|Размер PNG
ink|Color del código|Couleur du code|Колір коду|Цвет кода
navy|Azul marino|Bleu marine|Темно-синій|Тёмно-синий
black|Negro|Noir|Чорний|Чёрный
green|Verde bosque|Vert forêt|Лісовий зелений|Лесной зелёный
ready|LISTO|PRÊT|ГОТОВО|ГОТОВО
copy|Copiar enlace|Copier le lien|Копіювати посилання|Копировать ссылку
makeQr|Crear QR ↗|Créer un QR ↗|Створити QR ↗|Создать QR ↗
back|Volver al portfolio ↗|Retour au portfolio ↗|До портфоліо ↗|К портфолио ↗
invalid|Introduce una dirección pública HTTP o HTTPS válida, sin credenciales.|Saisissez une adresse publique HTTP ou HTTPS valide, sans identifiants.|Укажіть дійсну публічну адресу HTTP або HTTPS без облікових даних.|Укажите действительный публичный адрес HTTP или HTTPS без учётных данных.
working|Creando enlace…|Création du lien…|Створення посилання…|Создание ссылки…
limit|Límite de enlaces alcanzado. Inténtalo en una hora.|Limite de liens atteinte. Réessayez dans une heure.|Досягнуто ліміт посилань. Спробуйте за годину.|Достигнут лимит ссылок. Повторите через час.
capacity|El servicio está lleno. Inténtalo más tarde.|Le service est saturé. Réessayez plus tard.|Сховище сервісу заповнене. Спробуйте пізніше.|Хранилище сервиса заполнено. Повторите позже.
unavailable|Servicio no disponible. Comprueba la conexión y la configuración del servidor.|Service indisponible. Vérifiez la connexion et la configuration du serveur.|Сервіс недоступний. Перевірте з’єднання та налаштування сервера.|Сервис недоступен. Проверьте соединение и настройки сервера.
copied|Enlace copiado.|Lien copié.|Посилання скопійовано.|Ссылка скопирована.
copyError|No se pudo copiar. Selecciona la dirección y cópiala manualmente.|Copie impossible. Sélectionnez et copiez l’adresse manuellement.|Не вдалося скопіювати. Виділіть адресу та скопіюйте вручну.|Не удалось скопировать. Выделите адрес и скопируйте вручную.
generated|Listo. Ya puedes compartir el resultado.|Prêt. Vous pouvez partager le résultat.|Готово. Можна поділитися результатом.|Готово. Можно поделиться результатом.
expired|Válido hasta: |Valable jusqu’au : |Дійсне до: |Действует до: 
saved|Archivo listo para descargar.|Fichier prêt au téléchargement.|Файл готовий до завантаження.|Файл готов к скачиванию.
qrError|La dirección es demasiado larga para un QR. Acórtala e inténtalo de nuevo.|Adresse trop longue pour un QR. Raccourcissez-la et réessayez.|Адреса надто довга для QR. Скоротіть її та спробуйте знову.|Адрес слишком длинный для QR. Сократите его и повторите.
changed|Dirección modificada. Genera un nuevo resultado.|Adresse modifiée. Générez un nouveau résultat.|Адресу змінено. Створіть новий результат.|Адрес изменён. Создайте новый результат.
theme|Cambiar tema claro / oscuro|Changer le thème clair / sombre|Світла / темна тема|Светлая / тёмная тема
step1|Pega la dirección|Collez l’adresse|Вставте адресу|Вставьте адрес
step1Text|Un dominio es suficiente: añadimos HTTPS.|Un domaine suffit : nous ajoutons HTTPS.|Достатньо домену — додамо HTTPS.|Достаточно домена — добавим HTTPS.
step2|Crea el resultado|Créez le résultat|Створіть результат|Создайте результат
step3|Comparte|Partagez|Поділіться|Поделитесь
short.title|Dirección larga. Historia corta.|Adresse longue. Histoire courte.|Довга адреса. Коротка історія.|Длинный адрес. Короткая история.
short.intro|Convierte una URL larga en un enlace fácil de compartir.|Transformez une longue URL en un lien facile à partager.|Перетворіть довгу URL-адресу на зручне посилання.|Превратите длинный URL в удобную ссылку.
short.generate|Acortar enlace|Raccourcir le lien|Скоротити посилання|Сократить ссылку
short.privacy|La dirección se guarda 365 días en el servidor. No envíes enlaces confidenciales. Sin cuenta; hasta 20 enlaces nuevos por hora y dirección IP.|L’adresse est conservée 365 jours sur le serveur. N’envoyez pas de liens confidentiels. Sans compte ; 20 nouveaux liens par heure et adresse IP.|Адреса зберігається на сервері 365 днів. Не надсилайте конфіденційні посилання. Без реєстрації; до 20 нових посилань на годину з однієї IP-адреси.|Адрес хранится на сервере 365 дней. Не отправляйте конфиденциальные ссылки. Без регистрации; до 20 новых ссылок в час с одного IP-адреса.
short.emptyTitle|Menos caracteres. Más posibilidades.|Moins de caractères. Plus de possibilités.|Менше символів. Більше можливостей.|Меньше символов. Больше возможностей.
short.emptyText|Tu enlace aparecerá aquí después de acortar la dirección.|Votre lien apparaîtra ici après le raccourcissement.|Тут з’явиться посилання після скорочення адреси.|Здесь появится ссылка после сокращения адреса.
short.resultCaption|Tu enlace corto|Votre lien court|Ваше коротке посилання|Ваша короткая ссылка
short.step2Text|Guardamos la redirección durante 365 días.|La redirection est conservée 365 jours.|Зберігаємо перенаправлення на 365 днів.|Сохраняем перенаправление на 365 дней.
short.step3Text|Copia el enlace o crea un código QR.|Copiez le lien ou créez un code QR.|Скопіюйте посилання або створіть QR-код.|Скопируйте ссылку или создайте QR-код.
qr.title|Un enlace. Un escaneo.|Un lien. Un scan.|Одне посилання. Один скан.|Одна ссылка. Один скан.
qr.intro|Crea un QR claro para un sitio, portfolio o evento. Listo para pantalla e impresión.|Créez un QR lisible pour un site, un portfolio ou un événement. Pour écran et impression.|Створіть чіткий QR-код для сайту, портфоліо чи події. Для екрана та друку.|Создайте чёткий QR-код для сайта, портфолио или события. Для экрана и печати.
qr.generate|Generar código QR|Générer le code QR|Створити QR-код|Создать QR-код
qr.privacy|La dirección permanece en tu navegador. Generación y exportación locales, sin cuenta ni servicios externos.|L’adresse reste dans votre navigateur. Création et export locaux, sans compte ni service externe.|Адреса залишається у браузері. Створення й експорт локальні, без облікового запису та зовнішніх сервісів.|Адрес остаётся в браузере. Создание и экспорт локальные, без аккаунта и внешних сервисов.
qr.emptyTitle|Aquí aparecerá tu código.|Votre code apparaîtra ici.|Тут з’явиться ваш код.|Здесь появится ваш код.
qr.emptyText|Añade una dirección y elige un color. Del resto nos encargamos.|Ajoutez une adresse et choisissez une couleur. Nous faisons le reste.|Додайте адресу та виберіть колір. Решту зробимо ми.|Добавьте адрес и выберите цвет. Остальное сделаем мы.
qr.resultCaption|Dirección del código|Adresse encodée|Адреса в коді|Адрес в коде
qr.step2Text|Elige el color y la resolución PNG.|Choisissez la couleur et la résolution PNG.|Виберіть колір і роздільність PNG.|Выберите цвет и разрешение PNG.
qr.step3Text|Descarga PNG o SVG escalable.|Téléchargez un PNG ou un SVG vectoriel.|Завантажте PNG або масштабований SVG.|Скачайте PNG или масштабируемый SVG.`;
for(const lang of langs)NRLinkTranslations[lang]={short:{},qr:{}};
for(const line of data.split('\n')){const [key,...values]=line.split('|');langs.forEach((l,i)=>{const bits=key.split('.');if(bits.length===2)NRLinkTranslations[l][bits[0]][bits[1]]=values[i];else NRLinkTranslations[l][key]=values[i];});}
window.NRExtraImage=Object.fromEntries(langs.map(l=>[l,Object.fromEntries(Object.entries(NRLinkTranslations[l]).filter(([k,v])=>typeof v==='string'))]));
const images=`title|Tu imagen. Su propia dirección.|Votre image. Sa propre adresse.|Ваше зображення. Власна адреса.|Ваше изображение. Свой адрес.
intro|Convierte una imagen en un enlace. Añade el archivo, comprueba la vista previa y comparte.|Transformez une image en lien. Ajoutez le fichier, vérifiez l’aperçu et partagez.|Перетворіть зображення на посилання. Додайте файл, перевірте перегляд і поділіться.|Превратите изображение в ссылку. Добавьте файл, проверьте предпросмотр и поделитесь.
imageInputHeading|Elige una imagen|Choisissez une image|Виберіть зображення|Выберите изображение
imageOutputHeading|Tu imagen. Tu enlace.|Votre image. Votre lien.|Ваше зображення. Ваше посилання.|Ваше изображение. Ваша ссылка.
dropTitle|Arrastra una imagen aquí|Déposez une image ici|Перетягніть зображення сюди|Перетащите изображение сюда
dropSubtitle|o pulsa para elegir un archivo|ou cliquez pour choisir un fichier|або натисніть, щоб вибрати файл|или нажмите, чтобы выбрать файл
chooseFile|Elegir del dispositivo ↗|Choisir un fichier ↗|Вибрати з пристрою ↗|Выбрать с устройства ↗
formats|JPG, PNG, GIF, WebP, SVG y más · máx. {max} MB|JPG, PNG, GIF, WebP, SVG et plus · max. {max} Mo|JPG, PNG, GIF, WebP, SVG та інші · макс. {max} МБ|JPG, PNG, GIF, WebP, SVG и другие · макс. {max} МБ
allFormats|Todos los formatos admitidos|Tous les formats pris en charge|Усі підтримувані формати|Все поддерживаемые форматы
formatNote|SVG se convierte localmente a PNG (máx. 1 MB). TIFF y HEIC pueden no tener vista previa; el enlace permite descargar el original.|SVG est converti localement en PNG (max. 1 Mo). TIFF et HEIC peuvent ne pas avoir d’aperçu ; le lien permet de télécharger l’original.|SVG локально перетворюється на PNG (до 1 МБ). TIFF і HEIC можуть не мати перегляду; посилання дозволяє завантажити оригінал.|SVG локально преобразуется в PNG (до 1 МБ). TIFF и HEIC могут не иметь предпросмотра; ссылка позволяет скачать оригинал.
upload|Crear enlace a la imagen|Créer le lien de l’image|Створити посилання на зображення|Создать ссылку на изображение
uploading|Subiendo imagen…|Envoi de l’image…|Надсилання зображення…|Отправка изображения…
imagePrivacy|La imagen se envía solo al pulsar. Quien tenga el enlace podrá abrirla durante {days} días. Los originales conservan sus metadatos.|L’image est envoyée uniquement après clic. Toute personne ayant le lien peut l’ouvrir pendant {days} jours. Les originaux conservent leurs métadonnées.|Зображення надсилається лише після натискання. Кожен із посиланням може відкрити його протягом {days} днів. Оригінали зберігають метадані.|Изображение отправляется только после нажатия. Каждый со ссылкой может открыть его в течение {days} дней. Оригиналы сохраняют метаданные.
previewTitle|Del archivo a compartir.|Du fichier au partage.|Від файлу до поширення.|От файла к отправке.
previewDescription|Añade una imagen, crea un enlace y compártelo donde quieras.|Ajoutez une image, créez un lien et partagez-le où vous voulez.|Додайте зображення, створіть посилання та поділіться ним.|Добавьте изображение, создайте ссылку и поделитесь ею.
noPreview|Este navegador no muestra este formato. Puedes crear un enlace al archivo original.|Ce navigateur ne peut pas afficher ce format. Vous pouvez créer un lien vers le fichier original.|Браузер не показує цей формат. Можна створити посилання на оригінал.|Браузер не показывает этот формат. Можно создать ссылку на оригинал.
localPreview|VISTA PREVIA LOCAL|APERÇU LOCAL|ЛОКАЛЬНИЙ ПЕРЕГЛЯД|ЛОКАЛЬНЫЙ ПРЕДПРОСМОТР
publicPreview|PUBLICADO|PUBLIÉ|ОПУБЛІКОВАНО|ОПУБЛИКОВАНО
previewPrivate|Solo tú puedes ver esta vista previa.|Cet aperçu est visible uniquement par vous.|Цей перегляд бачите лише ви.|Этот предпросмотр видите только вы.
publicLink|ENLACE PÚBLICO A LA IMAGEN|LIEN PUBLIC DE L’IMAGE|ПУБЛІЧНЕ ПОСИЛАННЯ|ПУБЛИЧНАЯ ССЫЛКА
openImage|Abrir imagen ↗|Ouvrir l’image ↗|Відкрити зображення ↗|Открыть изображение ↗
deleteImage|Eliminar del servidor|Supprimer du serveur|Видалити із сервера|Удалить с сервера
receipt|Guardar enlace ↓|Enregistrer le lien ↓|Зберегти посилання ↓|Сохранить ссылку ↓
deleteNote|Puedes eliminar la imagen hasta elegir otra o salir de la página. Después el enlace caduca automáticamente.|La suppression reste disponible jusqu’au choix d’une autre image ou au départ de la page. Ensuite, le lien expire automatiquement.|Видалення доступне до вибору іншого зображення або виходу зі сторінки. Потім посилання спливе автоматично.|Удаление доступно до выбора другого изображения или выхода со страницы. Затем ссылка истечёт автоматически.
step1|Añade una imagen|Ajoutez une image|Додайте зображення|Добавьте изображение
step1Text|Arrastra el archivo o selecciónalo en tu dispositivo.|Déposez le fichier ou choisissez-le sur votre appareil.|Перетягніть файл або виберіть його на пристрої.|Перетащите файл или выберите его на устройстве.
step2|Crea un enlace público|Créez un lien public|Створіть публічне посилання|Создайте публичную ссылку
step2Text|El archivo se envía al servidor solo al pulsar.|Le fichier est envoyé au serveur uniquement après clic.|Файл надсилається на сервер лише після натискання.|Файл отправляется на сервер только после нажатия.
step3|Comparte a tu manera|Partagez à votre façon|Поділіться зручно|Поделитесь удобно
step3Text|Copia la dirección, abre la imagen o crea un QR.|Copiez l’adresse, ouvrez l’image ou créez un QR.|Скопіюйте адресу, відкрийте зображення або створіть QR.|Скопируйте адрес, откройте изображение или создайте QR.
removeFile|Quitar imagen seleccionada|Retirer l’image sélectionnée|Прибрати вибране зображення|Убрать выбранное изображение
checking|Comprobando archivo…|Vérification du fichier…|Перевірка файлу…|Проверка файла…
selected|Imagen lista. Crea un enlace para compartirla.|Image prête. Créez un lien pour la partager.|Зображення готове. Створіть посилання для поширення.|Изображение готово. Создайте ссылку для отправки.
svgConverted|SVG convertido a PNG. Solo se enviará la imagen preparada.|SVG converti en PNG. Seule l’image préparée sera envoyée.|SVG перетворено на PNG. Буде надіслано лише готове зображення.|SVG преобразован в PNG. Будет отправлено только готовое изображение.
checkingService|Comprobando disponibilidad…|Vérification du service…|Перевірка сервісу…|Проверка сервиса…
deleted|Imagen eliminada. El enlace anterior ya no funciona.|Image supprimée. L’ancien lien ne fonctionne plus.|Зображення видалено. Попереднє посилання більше не працює.|Изображение удалено. Прежняя ссылка больше не работает.
deleting|Eliminando imagen…|Suppression de l’image…|Видалення зображення…|Удаление изображения…
expiry|Enlace válido hasta: {date}|Lien valable jusqu’au : {date}|Посилання дійсне до: {date}|Ссылка действует до: {date}
emptyFile|El archivo está vacío. Elige otro.|Le fichier est vide. Choisissez-en un autre.|Файл порожній. Виберіть інший.|Файл пуст. Выберите другой.
too_large|El archivo supera {max} MB. Elige uno más pequeño.|Le fichier dépasse {max} Mo. Choisissez un fichier plus petit.|Файл перевищує {max} МБ. Виберіть менший.|Файл превышает {max} МБ. Выберите меньший.
unsupported|Formato no reconocido. Consulta la lista de formatos admitidos.|Format non reconnu. Consultez les formats pris en charge.|Формат не розпізнано. Перевірте список форматів.|Формат не распознан. Проверьте список форматов.
invalid_image|No se puede leer la imagen. Puede estar dañada.|Image illisible. Le fichier peut être endommagé.|Не вдалося прочитати зображення. Файл може бути пошкоджено.|Не удалось прочитать изображение. Файл может быть повреждён.
dimensions|Imagen demasiado grande. Límite: 40 megapíxeles.|Image trop grande. Limite : 40 mégapixels.|Зображення завелике. Ліміт: 40 мегапікселів.|Изображение слишком большое. Лимит: 40 мегапикселей.
svgTooLarge|SVG admite un máximo de 1 MB.|SVG : 1 Mo maximum.|SVG може мати не більше 1 МБ.|SVG может иметь не более 1 МБ.
unsafeSvg|El SVG contiene scripts, animaciones o recursos externos. Exporta a PNG.|Le SVG contient des scripts, animations ou ressources externes. Exportez en PNG.|SVG містить скрипти, анімації або зовнішні ресурси. Експортуйте в PNG.|SVG содержит скрипты, анимацию или внешние ресурсы. Экспортируйте в PNG.
previewTimeout|La lectura tardó demasiado. Prueba con un archivo más pequeño.|Lecture trop longue. Essayez un fichier plus petit.|Читання триває надто довго. Спробуйте менший файл.|Чтение длится слишком долго. Попробуйте файл поменьше.
multiple|Elige una imagen a la vez.|Choisissez une image à la fois.|Вибирайте одне зображення за раз.|Выбирайте одно изображение за раз.
rate_limit|Límite de envíos alcanzado. Inténtalo más tarde.|Limite d’envoi atteinte. Réessayez plus tard.|Досягнуто ліміт надсилань. Спробуйте пізніше.|Достигнут лимит отправок. Повторите позже.
origin|El servicio no está conectado al dominio de esta aplicación.|Le service n’est pas connecté au domaine de cette application.|Сервіс не підключено до домену застосунку.|Сервис не подключён к домену приложения.
forbidden|No se pudo verificar el permiso para eliminar la imagen.|Autorisation de suppression non vérifiée.|Не вдалося підтвердити право на видалення.|Не удалось подтвердить право на удаление.
not_found|La imagen ya no está disponible.|L’image n’est plus disponible.|Зображення більше недоступне.|Изображение больше недоступно.
expired|El enlace de la imagen ha caducado.|Le lien de l’image a expiré.|Термін дії посилання сплив.|Срок действия ссылки истёк.
invalid_request|No se pudo procesar la solicitud. Inténtalo de nuevo.|Requête non traitée. Réessayez.|Не вдалося обробити запит. Спробуйте знову.|Не удалось обработать запрос. Повторите попытку.
no_file|Elige una imagen antes de crear el enlace.|Choisissez une image avant de créer le lien.|Виберіть зображення перед створенням посилання.|Выберите изображение перед созданием ссылки.
retry|Reintentar|Réessayer|Спробувати знову|Повторить
meta|NR. Link Studio — enlaces, QR, imágenes y conversión de archivos.|NR. Link Studio — liens, QR, images et conversion de fichiers.|NR. Link Studio — посилання, QR, зображення та конвертація файлів.|NR. Link Studio — ссылки, QR, изображения и конвертация файлов.`;
for(const line of images.split('\n')){const [key,...values]=line.split('|');langs.forEach((l,i)=>NRExtraImage[l][key]=values[i]);}
})();
