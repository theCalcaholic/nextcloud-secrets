OC.L10N.register(
    "secrets",
    {
    "Secrets" : "الأسرار",
    "Secret '{secret}' has been retrieved" : "تم استرداد السر \"{secret}\"",
    "Securely share data via link" : "مشاركة البيانات بأمان عبر الرابط",
    "Secrets allows users to generate share links for text based data (e.g. passwords, CSV lists, bank accounts...) that can be sent to anyone (including receivers without a Nextcloud account) for retrieval. The data itself will be end-to-end encrypted (so not even Nextcloud can access it) and the encryption key will be part of the share link (the anchor part) - but never be actually sent to the server. Once retrieved, the secret will be deleted from the server, ensuring, that if it arrived at the correct receiver it has been seen by nobody else.\n\nSecrets now comes with a cli that can be used to automate the provisioning of secret shares: https://github.com/theCalcaholic/nextcloud-secrets/releases" : "تُمكِّن \"الأسرار\" المستخدِمين بإنشاء روابط مشاركة للبيانات النصية (مثل كلمات المرور وقوائم CSV والحسابات المصرفية...) التي يمكن إرسالها إلى أي شخص (بما في ذلك أجهزة الاستقبال التي ليس لديها حساب على نكست كلاود) لاسترجاعها. سيتم تشفير البيانات نفسها من طرف إلى طرف (بحيث لا يتمكن حتى نكست كلاود نفسه من الوصول إليها) وسيكون مفتاح التشفير جزءاً من رابط المشاركة (الجزء الأساسي) - ولكن لن يتم إرساله فعلياً إلى الخادوم. بمجرد استرداده، سيتم حذف \"السر\" من الخادوم، مما يضمن أنه إذا وصل إلى جهاز الاستقبال الصحيح فلن يراه أي شخص آخر. \n\nتأتي \"الأسرار\" الآن مع واجهة الأوامر السطرية cli التي يمكن استخدامها لأتمتة عملية توفير المشاركات السرية:\n https://github.com/theCalcaholic/nextcloud-secrets/releases.",
    "New secret" : "سر جديد",
    "Change Title" : "غير العنوان",
    "Cancel secret creation" : "إلغاء إنشاء السر",
    "Delete secret" : "حذف السر",
    "Your secret is stored end-to-end encrypted on the server. " : "يتم تخزين سرك بشكل مشفر من طرف إلى طرف على الخادم.",
    "Create a secret to get started" : "قم بإنشاء سر لتبدأ",
    "Could not fetch secrets" : "تعذر استدعاء الأسرار",
    "New Secret" : "سر جديد",
    "Could not create the secret" : "تعذر إنشاء السر",
    "Secret deleted" : "تم حذف السر",
    "Could not delete the secret" : "تعذر حذف السر",
    "Share Link" : "شارك الرابط",
    "Expires on:" : "تنتهي صلاحيته في:",
    "password protected" : "محمي بكلمة سر",
    "Share Link:" : "مشاركة الرابط",
    "Copy Secret Link" : "نسخ رابط السر",
    "This secret has already been retrieved and its content was consequently deleted from the server." : "تم استرداد هذا السر بالفعل وبالتالي تم حذف محتواه من الخادم.",
    "Could not decrypt secret (key not available locally)." : "تعذر فك تشفير السر (المفتاح غير متوفر محليًا).",
    "_Will be deleted in %n day_::_Will be deleted in %n days_" : ["سوف يتم الحذف خلال %n أيام","سوف يتم الحذف خلال %n يوم","سوف يتم الحذف خلال %n أيام","سوف يتم الحذف خلال %n أيام","سوف يتم الحذف خلال %nأيام","سوف يتم الحذف خلال %nأيام"],
    "Expiration Date" : "تاريخ انتهاء الصلاحية",
    "share password (optional)" : "مشاركة كلمة المرور (اختياري)",
    "Save" : "حفظ",
    "The following secret has been shared with you securely:" : "تمت مشاركة السر التالي معك بشكل آمن:",
    "Please make sure you have copied and stored the secret before closing this page! It is now deleted on the server." : "يرجى التأكد من نسخ السر وتخزينه قبل إغلاق هذه الصفحة! يتم الآن حذفه من على الخادم.",
    "Copy the secret's content to the clipboard" : "نسخ محتوى السر إلى الحافظة",
    "Copy to Clipboard" : "نسخ إلى الحافظة",
    "Download the secret's content as a file" : "تنزيل محتوي السر فى صورة ملف",
    "Download" : "تنزيل",
    "Retrieving secret..." : "جاري استرداد السر ...",
    "Error loading secret. Is your link correct?" : "خطأ في تحميل السر. هل الرابط الخاص بك صحيح؟",
    "Revealing will delete the secret from the server. You will not be able to retrieve it again." : "سيؤدي الكشف إلى حذف السر من الخادوم، و لن تتمكن من استعادته مرة أخرى.",
    "Reveal the secret and delete it on the server" : "كشف السر وحذفه من على الخادم",
    "I understand. Reveal and destroy Secret." : "أنا أفهم. إكشِف و دمِّر السّر.",
    "Could not decrypt secret" : "لا يمكن فك تشفير السر",
    "This share is password-protected" : "هذه المشاركة محمية بكلمة مرور",
    "The password is wrong or has expired. Please try again." : "كلمة المرور خاطئة أو منتهية الصلاحية. حاول مرة اخرى.",
    "Password" : "كلمة السر",
    "This path has changed. Redirecting you to the new location. If this doesn't work, click the following link:" : "لقد تغير هذا المسار. ستتم إعادة توجيهك إلى الموقع الجديد. إذا لم ينجح ذلك، انقُر على الرابط التالي:",
    "Go to secret" : "إذهب إلى السّر",
    "Securely share data with anyone. All data is end-to-end encrypted by the user and will be deleted once retrieved successfully" : "شارك البيانات مع أي شخص بصورة آمنة. كل البيانات مشفرة من الحَدِّ للحَدِّ و سيقع حذفها بمجرد إتمام استلامها بنجاحٍ"
},
"nplurals=6; plural=n==0 ? 0 : n==1 ? 1 : n==2 ? 2 : n%100>=3 && n%100<=10 ? 3 : n%100>=11 && n%100<=99 ? 4 : 5;");
