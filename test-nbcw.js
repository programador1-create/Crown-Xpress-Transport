// Script para probar conexión NBCW localmente
// Ejecutar con: node test-nbcw.js

async function testNbcw() {
  try {
    console.log('🔍 Iniciando prueba NBCW...')
    
    // Verificar variables de entorno
    console.log('📋 Variables de entorno:')
    console.log('  DATABASE_URL:', process.env.DATABASE_URL ? '✅ Configurada' : '❌ No configurada')
    console.log('  DATABASE_URL_NBCW:', process.env.DATABASE_URL_NBCW ? '✅ Configurada' : '❌ No configurada')
    
    if (!process.env.DATABASE_URL_NBCW) {
      console.error('❌ DATABASE_URL_NBCW no está configurada')
      console.log('💡 Agrega esta variable a tu archivo .env:')
      console.log('   DATABASE_URL_NBCW=postgresql://usuario:password@host:puerto/database')
      return
    }
    
    // Importar y probar conexión
    console.log('🔗 Probando conexión a NBCW...')
    const { getNbcwSql } = require('./api/_lib/db.js')
    const sql = getNbcwSql()
    
    // Probar query simple
    console.log('📊 Ejecutando query de prueba...')
    const result = await sql`SELECT COUNT(*) as total FROM tpr`
    console.log(`✅ Conexión exitosa. Total registros: ${result[0].total}`)
    
    // Probar query CXT6
    console.log('🚛 Buscando registros CXT6...')
    const cxt6 = await sql`
      SELECT WONO, DRVCODE, FROMD, TOD, FECHA 
      FROM tpr 
      WHERE TRIM(FROMD) = 'CXT6' OR TRIM(TOD) = 'CXT6'
      LIMIT 3
    `
    
    if (cxt6.length > 0) {
      console.log(`✅ Encontrados ${cxt6.length} registros CXT6:`)
      cxt6.forEach((record, i) => {
        console.log(`  ${i+1}. WO: ${record.WONO}, DRV: ${record.DRVCODE}, FROMD: "${record.FROMD}" → TOD: "${record.TOD}"`)
      })
    } else {
      console.log('❌ No se encontraron registros CXT6')
      console.log('🔍 Probando con otros formatos...')
      
      // Verificar qué FROMD values existen
      const fromdValues = await sql`
        SELECT DISTINCT TRIM(FROMD) as fromd_clean, COUNT(*) as count
        FROM tpr 
        WHERE FROMD IS NOT NULL AND FROMD != ''
        GROUP BY TRIM(FROMD)
        ORDER BY count DESC
        LIMIT 10
      `
      
      console.log('📋 FROMD values encontrados:')
      fromdValues.forEach(v => {
        console.log(`  "${v.fromd_clean}": ${v.count} registros`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error en prueba NBCW:', error.message)
    console.error('Stack:', error.stack)
  }
}

// Cargar variables de entorno desde .env si existe
try {
  require('dotenv').config()
} catch (e) {
  console.log('⚠️  dotenv no encontrado, usando variables de entorno del sistema')
}

testNbcw()
