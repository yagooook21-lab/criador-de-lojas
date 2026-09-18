const fs = require('fs');
const path = './src/components/AdminTopbar.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['<h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("topbar.developer_contact")}</h3>', '<h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{t("topbar.dev_contact")}</h3>'],
  ['<span className="text-sm font-medium">Alterar credenciais</span>', '<span className="text-sm font-medium">{t("topbar.change_credentials")}</span>'],
  ['<label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">\s*<Mail className="w-3 h-3" \/> Novo email\s*<\/label>', '<label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"><Mail className="w-3 h-3" /> {t("topbar.new_email")}</label>'],
  ['Alterar email', '{t("topbar.update_email")}'],
  ['<label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">\s*<KeyRound className="w-3 h-3" \/> Nova senha\s*<\/label>', '<label className="flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wide"><KeyRound className="w-3 h-3" /> {t("topbar.new_password")}</label>'],
  ['placeholder="Confirmar senha"', 'placeholder={t("topbar.confirm_password")}'],
  ['Alterar senha', '{t("topbar.update_password")}'],
];

// Using regex for multiline or complex matches
replacements.forEach(([search, replace]) => {
  if (search.includes('\\s*')) {
    const regex = new RegExp(search, 'g');
    content = content.replace(regex, replace);
  } else {
    content = content.replace(search, replace);
  }
});

// Fix toasts too
content = content.replace('toast.error("Informe o novo email");', 'toast.error(t("topbar.error_no_email") || "Informe o novo email");');
// ... i'll add toast keys to i18n too later if needed

fs.writeFileSync(path, content, 'utf8');
