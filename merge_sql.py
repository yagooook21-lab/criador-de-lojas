import os
import re
import glob

def parse_sql_file(filepath):
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()

    # Extrair CREATE TABLE
    # Pattern to match CREATE TABLE `tablename` (...)
    create_pattern = re.compile(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?([a-zA-Z0-9_]+)`?\s*\((.*?)\)\s*(?:ENGINE[^\;]+)?;', re.IGNORECASE | re.DOTALL)
    
    # Extrair INSERT INTO
    insert_pattern = re.compile(r'INSERT\s+INTO\s+`?([a-zA-Z0-9_]+)`?\s*(?:\([^)]+\))?\s*VALUES\s*(.*?);', re.IGNORECASE | re.DOTALL)
    
    tables = {}
    for match in create_pattern.finditer(content):
        t_name = match.group(1).lower()
        tables[t_name] = match.group(0)
        
    inserts = {}
    for match in insert_pattern.finditer(content):
        t_name = match.group(1).lower()
        if t_name not in inserts:
            inserts[t_name] = []
        inserts[t_name].append(match.group(0))
        
    return tables, inserts

def main():
    base_file = 'u606049230_loj23.sql'
    all_sql_files = glob.glob('*.sql')
    
    if base_file in all_sql_files:
        all_sql_files.remove(base_file)
        
    # Colocar o base_file no início para ter prioridade
    all_sql_files = [base_file] + all_sql_files
    
    final_tables = {}
    final_inserts = {}
    
    for sql_file in all_sql_files:
        print(f"Lendo {sql_file}...")
        try:
            t, i = parse_sql_file(sql_file)
            for t_name, t_sql in t.items():
                if t_name not in final_tables:
                    final_tables[t_name] = t_sql
            
            for t_name, i_sqls in i.items():
                if t_name not in final_inserts:
                    final_inserts[t_name] = i_sqls
        except Exception as e:
            print(f"Erro ao processar {sql_file}: {e}")

    out_file = 'banco_unificado.sql'
    with open(out_file, 'w', encoding='utf-8') as out:
        out.write("-- Arquivo gerado automaticamente - Unificação de Tabelas\n\n")
        out.write("SET SQL_MODE = \"NO_AUTO_VALUE_ON_ZERO\";\nSTART TRANSACTION;\nSET time_zone = \"+00:00\";\n\n")
        
        # Escrever tabelas
        out.write("-- ESTRUTURAS\n")
        for t_name, t_sql in final_tables.items():
            out.write(f"-- Tabela: {t_name}\n")
            out.write(f"{t_sql}\n\n")
            
        # Escrever Inserts
        out.write("-- DADOS\n")
        for t_name, i_sqls in final_inserts.items():
            out.write(f"-- Inserts: {t_name}\n")
            for i_sql in i_sqls:
                out.write(f"{i_sql}\n")
            out.write("\n")
            
        out.write("COMMIT;\n")

    print(f"Arquivo {out_file} gerado com sucesso!")

    # Mover arquivos para backup
    if not os.path.exists('backup_sql'):
        os.makedirs('backup_sql')
        
    for sql_file in all_sql_files:
        if sql_file != out_file:
            try:
                os.rename(sql_file, os.path.join('backup_sql', sql_file))
                print(f"Movido: {sql_file} -> backup_sql/")
            except Exception as e:
                print(f"Erro ao mover {sql_file}: {e}")

if __name__ == '__main__':
    main()
