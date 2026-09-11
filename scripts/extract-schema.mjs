import { neon } from '@neondatabase/serverless'

const sql = neon('postgresql://neondb_owner:npg_1FhPVkX3wISq@ep-polished-queen-axrtw0ec-pooler.c-4.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require')

async function main() {
  // 1. Tamaño total
  const dbSize = await sql`SELECT pg_size_pretty(pg_database_size(current_database())) AS db_size`
  console.log('=== TAMAÑO TOTAL BD ===')
  console.log(JSON.stringify(dbSize, null, 2))

  // 2. Todas las tablas con tamaños y row count
  const tables = await sql`
    SELECT 
      relname AS table_name,
      pg_size_pretty(pg_total_relation_size(relid)) AS total_size,
      pg_size_pretty(pg_relation_size(relid)) AS data_size,
      n_live_tup AS approx_rows
    FROM pg_stat_user_tables 
    WHERE schemaname = 'public'
    ORDER BY pg_total_relation_size(relid) DESC
  `
  console.log('\n=== TABLAS (con tamaños y filas) ===')
  console.log(JSON.stringify(tables, null, 2))

  // 3. Columnas de cada tabla
  const columns = await sql`
    SELECT 
      t.table_name,
      c.ordinal_position,
      c.column_name,
      c.data_type,
      c.character_maximum_length,
      c.numeric_precision,
      c.is_nullable,
      c.column_default
    FROM information_schema.tables t
    JOIN information_schema.columns c ON t.table_name = c.table_name
    WHERE t.table_schema = 'public' AND t.table_type = 'BASE TABLE'
    ORDER BY t.table_name, c.ordinal_position
  `
  console.log('\n=== COLUMNAS DE TODAS LAS TABLAS ===')
  for (const col of columns) {
    console.log(`${col.table_name}.${col.column_name} | ${col.data_type}${col.character_maximum_length ? '(' + col.character_maximum_length + ')' : ''} | nullable=${col.is_nullable} | default=${col.column_default || 'NONE'}`)
  }

  // 4. Claves primarias
  const pks = await sql`
    SELECT
      tc.table_name,
      kcu.column_name,
      tc.constraint_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'PRIMARY KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, kcu.ordinal_position
  `
  console.log('\n=== CLAVES PRIMARIAS ===')
  console.log(JSON.stringify(pks, null, 2))

  // 5. Claves foráneas
  const fks = await sql`
    SELECT
      tc.table_name AS child_table,
      kcu.column_name AS child_column,
      ccu.table_name AS parent_table,
      ccu.column_name AS parent_column,
      tc.constraint_name,
      rc.delete_rule,
      rc.update_rule
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
    JOIN information_schema.constraint_column_usage ccu ON rc.unique_constraint_name = ccu.constraint_name
    WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema = 'public'
    ORDER BY tc.table_name
  `
  console.log('\n=== CLAVES FORÁNEAS ===')
  console.log(JSON.stringify(fks, null, 2))

  // 6. Índices
  const indexes = await sql`
    SELECT
      schemaname AS schema,
      tablename AS table_name,
      indexname,
      indexdef AS definition
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname
  `
  console.log('\n=== ÍNDICES ===')
  for (const idx of indexes) {
    console.log(`${idx.table_name}: ${idx.indexname}`)
    console.log(`  ${idx.definition}`)
  }

  // 7. Vistas
  const views = await sql`
    SELECT viewname AS view_name, definition 
    FROM pg_views 
    WHERE schemaname = 'public'
  `
  console.log('\n=== VISTAS ===')
  for (const v of views) {
    console.log(`Vista: ${v.view_name}`)
    console.log(v.definition)
    console.log('---')
  }

  // 8. Secuencias
  const seqs = await sql`
    SELECT sequence_name, data_type, start_value, minimum_value, maximum_value, increment
    FROM information_schema.sequences 
    WHERE sequence_schema = 'public'
  `
  console.log('\n=== SECUENCIAS ===')
  console.log(JSON.stringify(seqs, null, 2))

  // 9. Constraints UNIQUE
  const uniques = await sql`
    SELECT
      tc.table_name,
      tc.constraint_name,
      kcu.column_name
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.constraint_type = 'UNIQUE' AND tc.table_schema = 'public'
    ORDER BY tc.table_name, tc.constraint_name, kcu.ordinal_position
  `
  console.log('\n=== CONSTRAINTS UNIQUE ===')
  console.log(JSON.stringify(uniques, null, 2))

  // 10. Constraints CHECK
  const checks = await sql`
    SELECT
      tc.table_name,
      tc.constraint_name,
      cc.check_clause
    FROM information_schema.table_constraints tc
    JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
    WHERE tc.constraint_type = 'CHECK' AND tc.table_schema = 'public'
  `
  console.log('\n=== CONSTRAINTS CHECK ===')
  console.log(JSON.stringify(checks, null, 2))

  // 11. Conteos exactos por tabla
  const tableNames = tables.map(t => t.table_name)
  console.log('\n=== CONTEOS EXACTOS ===')
  for (const tname of tableNames) {
    const count = await sql`SELECT count(*)::int AS cnt FROM ${sql(tname)}`
    console.log(`${tname}: ${count[0].cnt}`)
  }

  console.log('\n=== EXTRACCIÓN COMPLETA ===')
}

main().catch(e => console.error('ERROR:', e))
