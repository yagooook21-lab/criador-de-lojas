const fs = require('fs');
const path = './src/pages/AdminSettings.tsx';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the SPA row I added previously
const spaRow = `                  <div className="flex items-center justify-between p-3 rounded-[5px] bg-secondary/30 border border-border/50 opacity-80">
                    <div>
                      <h4 className="text-sm font-medium text-foreground">SPA</h4>
                      <p className="text-xs text-muted-foreground italic">Em breve</p>
                    </div>
                    <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded font-bold uppercase tracking-wider">Breve</span>
                  </div>`;
content = content.replace(spaRow, '');

// 2. Add Monitor to imports
content = content.replace('MessageSquare } from "lucide-react"', 'MessageSquare, Monitor } from "lucide-react"');

// 3. Add "spa" to TabId type
content = content.replace('type TabId = "language" | "payment" | "shipping" | "coupons" | "tracking" | "mascara" | "communications";', 'type TabId = "language" | "payment" | "shipping" | "coupons" | "tracking" | "mascara" | "communications" | "spa";');

// 4. Add "spa" to tabs array
const tabsSearch = '{ id: "communications", label: "Comunicao", icon: MessageSquare },';
const tabsReplace = '{ id: "communications", label: "Comunicao", icon: MessageSquare },\n    { id: "spa", label: "SPA", icon: Monitor, isSoon: true },';
// Wait, the file uses "Comunicação" but the tool output might have encoding issues. 
// I'll search for just the id communications part.

content = content.replace('{ id: "communications", label: "Comunicação", icon: MessageSquare },', '{ id: "communications", label: "Comunicação", icon: MessageSquare },\n    { id: "spa", label: "SPA", icon: Monitor, isSoon: true },');

fs.writeFileSync(path, content, 'utf8');
