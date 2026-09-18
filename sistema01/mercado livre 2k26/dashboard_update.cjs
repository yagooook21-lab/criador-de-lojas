const fs = require('fs');
const path = './src/pages/AdminDashboard.tsx';
let content = fs.readFileSync(path, 'utf8');

const replacements = [
  ['<h2 className="text-2xl font-bold text-foreground tracking-tight">Painel Executivo</h2>', '<h2 className="text-2xl font-bold text-foreground tracking-tight">{t("dash.title")}</h2>'],
  ['Monitore o desempenho da sua loja em tempo real', '{t("dash.subtitle")}'],
  ['Hoje', '{t("dash.today")}'],
  ['7 dias', '{t("dash.7days")}'],
  ['30 dias', '{t("dash.30days")}'],
  ['label="Boletos Gerados"', 'label={t("dash.boletos_generated")}'],
  ['<p className="text-sm text-muted-foreground text-center py-4">Nenhum visitante online no momento</p>', '<p className="text-sm text-muted-foreground text-center py-4">{t("dash.no_visitors")}</p>'],
  ['<p className="text-sm text-muted-foreground text-center py-4">Sem dados de tráfego disponíveis</p>', '<p className="text-sm text-muted-foreground text-center py-4">{t("dash.no_traffic")}</p>'],
  ['v.city || "Desconhecido"', 'v.city || t("dash.unknown")'],
  ['key = v.state || "Desconhecido"', 'key = v.state || t("dash.unknown")'],
];

replacements.forEach(([search, replace]) => {
  content = content.replace(search, replace);
});

fs.writeFileSync(path, content, 'utf8');
