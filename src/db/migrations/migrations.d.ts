// Tipos para o migrations.js gerado pelo drizzle-kit (que é JavaScript e importa arquivos .sql).
declare const migrations: {
  journal: {
    entries: { idx: number; when: number; tag: string; breakpoints: boolean }[];
  };
  migrations: Record<string, string>;
};

export default migrations;
