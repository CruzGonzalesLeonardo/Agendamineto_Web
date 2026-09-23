param(
    [string]$outputPath = "g:\MathiusDigital\Escritorio\Agendamiento\Informe_Agendamiento_Banco_de_la_Nacion.docx"
)

Add-Type -AssemblyName System.IO.Compression.FileSystem

$tempDir = Join-Path $env:TEMP ([System.Guid]::NewGuid().ToString())
New-Item -ItemType Directory -Path (Join-Path $tempDir "_rels") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "word") -Force | Out-Null
New-Item -ItemType Directory -Path (Join-Path $tempDir "word\_rels") -Force | Out-Null

$contentTypes = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "[Content_Types].xml"), $contentTypes, [System.Text.Encoding]::UTF8)

$rels = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "_rels\.rels"), $rels, [System.Text.Encoding]::UTF8)

$styles = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri" w:cs="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="1E293B"/>
        <w:lang w:val="es-ES"/>
      </w:rPr>
    </w:rPrDefault>
    <w:pPrDefault>
      <w:pPr>
        <w:spacing w:after="160" w:line="276" w:lineRule="auto"/>
      </w:pPr>
    </w:pPrDefault>
  </w:docDefaults>
</w:styles>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "word\styles.xml"), $styles, [System.Text.Encoding]::UTF8)

$document = @'
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <w:body>

    <!-- PORTADA / CARÁTULA -->
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="600" w:after="160"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
          <w:color w:val="9A0B22"/>
        </w:rPr>
        <w:t>BANCO DE LA NACIÓN DEL PERÚ</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="100" w:after="400"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:sz w:val="22"/>
          <w:color w:val="64748B"/>
        </w:rPr>
        <w:t>INFORME DE GESTIÓN ÁGIL Y DESARROLLO DE SOFTWARE</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="400" w:after="300"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="44"/>
          <w:color w:val="C8102E"/>
        </w:rPr>
        <w:t>Sistema Web de Agendamiento de Citas y Orientación Ciudadana</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:spacing w:before="100" w:after="600"/>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:i/>
          <w:sz w:val="24"/>
          <w:color w:val="334155"/>
        </w:rPr>
        <w:t>Optimización de flujos de atención y eliminación de colas físicas mediante reservas QR y arquitectura limpia</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr>
        <w:spacing w:before="200" w:after="200"/>
      </w:pPr>
      <w:r><w:t></w:t></w:r>
    </w:p>

    <!-- 4.1 CARÁTULA Y FICHA DE EQUIPO -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="400" w:after="200"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="C8102E"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4.1 Carátula y Ficha de Equipo</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Proyecto: </w:t>
      </w:r>
      <w:r>
        <w:t>Sistema Web de Agendamiento de Citas y Orientación Ciudadana</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Entidad de Referencia: </w:t>
      </w:r>
      <w:r>
        <w:t>Banco de la Nación del Perú</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Repositorio Oficial Git: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:color w:val="0284C7"/><w:u w:val="single"/></w:rPr>
        <w:t>https://github.com/CruzGonzalesLeonardo/Agendamineto_Web</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Rama Oficial de Producción: </w:t>
      </w:r>
      <w:r>
        <w:t>main</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="200" w:after="120"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>Ficha de Miembros del Equipo Scrum (4 Integrantes)</w:t>
      </w:r>
    </w:p>

    <!-- TABLA DE EQUIPO -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9200" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="none"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="none"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <!-- HEADER -->
      <w:tr>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3000" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="0F172A"/>
          </w:tcPr>
          <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Integrante</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="2400" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="0F172A"/>
          </w:tcPr>
          <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Rol Scrum</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr>
            <w:tcW w:w="3800" w:type="dxa"/>
            <w:shd w:val="clear" w:color="auto" w:fill="0F172A"/>
          </w:tcPr>
          <w:p><w:pPr><w:jc w:val="left"/></w:pPr><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Responsabilidad Principal</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- FILA 1: PRINCIPAL -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="3000" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FEF2F2"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="9A0B22"/></w:rPr><w:t>Leonardo Cruz Gonzales</w:t></w:r><w:r><w:rPr><w:sz w:val="18"/><w:color w:val="C8102E"/></w:rPr><w:t> (Principal)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FEF2F2"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="9A0B22"/></w:rPr><w:t>Product Owner (PO) / Líder Técnico</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="FEF2F2"/></w:tcPr>
          <w:p><w:r><w:t>Definición de visión del producto, priorización del Product Backlog, criterios de aceptación, diseño de la arquitectura por capas y control de calidad general.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- FILA 2 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Integrante 2 (Compañero)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Scrum Master (SM)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Facilitación de ceremonias ágiles, remoción de bloqueos, monitoreo del tablero visual y gestión de la velocidad del equipo.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- FILA 3 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Integrante 3 (Compañero)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Fullstack Developer (Backend &amp; DB)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Implementación de base de datos PostgreSQL en Supabase, funciones de reserva con bloqueo atómico FOR UPDATE y endpoints Server Actions.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- FILA 4 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="3000" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Integrante 4 (Compañero)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="2400" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Frontend Developer &amp; QA</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>Desarrollo de interfaces con React 19 y TailwindCSS, diseño responsive móvil/desktop, generación de tickets QR y pruebas funcionales.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- 4.2 DEFINICIÓN Y ALCANCE DE LA SOLUCIÓN -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="600" w:after="200"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="C8102E"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4.2 Definición y Alcance de la Solución</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>1. Justificación del Software</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>El Banco de la Nación del Perú atiende a una gran masa poblacional para operaciones clave como el cobro de bonos estatales, pago de tasas judiciales/administrativas, cobro de pensiones y servicios bancarios generales. Históricamente, este alto volumen genera aglomeraciones en los exteriores de las agencias desde tempranas horas, deteriorando la experiencia del ciudadano y saturando la capacidad de las ventanillas. Este proyecto digitaliza el proceso de acceso al banco, permitiendo que el usuario reserve su turno exacto y verifique sus requisitos antes de salir de casa.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>2. Problema que Resuelve</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>a) Colas físicas excesivas: </w:t></w:r>
      <w:r><w:t>Tiempos de espera presenciales que superan habitualmente las dos horas en agencias de alta afluencia.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>b) Desorientación documentaria: </w:t></w:r>
      <w:r><w:t>Ciudadanos que pierden su turno al llegar a ventanilla por no portar la documentación o copia específica del trámite.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>c) Sobrecarga del personal de ventanilla: </w:t></w:r>
      <w:r><w:t>Falta de un sistema previo que ordene y balancee la llegada de clientes según la duración estimada del servicio.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>d) Riesgo de duplicidad de turnos: </w:t></w:r>
      <w:r><w:t>Necesidad de una validación concurrente que impida la asignación múltiple de una misma franja horaria.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>3. Arquitectura General y Tecnologías</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>La solución implementa una Arquitectura Limpia (Hexagonal / Clean Architecture) desacoplada en 4 niveles:</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Capa de Dominio (src/domain): </w:t></w:r>
      <w:r><w:t>Entidades puras y tipos TypeScript (Usuario, Agencia, Trámite, Cita, Horario) libres de dependencias de frameworks.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Capa de Aplicación (src/application): </w:t></w:r>
      <w:r><w:t>Puertos (AppointmentRepository, NotificationService) y Casos de Uso (CreateAppointmentUseCase).</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Capa de Infraestructura (src/infrastructure): </w:t></w:r>
      <w:r><w:t>Adaptadores Supabase PostgreSQL, control RBAC vía Row Level Security (RLS) y clientes @supabase/ssr.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Capa de Presentación (src/app): </w:t></w:r>
      <w:r><w:t>Next.js 16 con App Router, React 19, TailwindCSS 4 y Server Actions para mutaciones atómicas.</w:t></w:r>
    </w:p>

    <!-- 4.3 GESTIÓN DEL BACKLOG -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="600" w:after="200"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="C8102E"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4.3 Gestión del Backlog y Definición de Terminado (DoD)</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="60"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>Definition of Done (DoD) del Equipo:</w:t>
      </w:r>
    </w:p>
    <w:p><w:r><w:t>1. Código subido y revisado en el repositorio GitHub oficial mediante Pull Request a 'main'.</w:t></w:r></w:p>
    <w:p><w:r><w:t>2. Cumplimiento estricto de tipos en TypeScript y linteo con 'npm run lint' sin warnings críticos.</w:t></w:r></w:p>
    <w:p><w:r><w:t>3. Criterios de aceptación verificados y comprobados funcionalmente en navegador web y móvil.</w:t></w:r></w:p>
    <w:p><w:r><w:t>4. Políticas de seguridad y aislamiento por roles (RLS en Supabase) comprobadas.</w:t></w:r></w:p>
    <w:p><w:r><w:t>5. Despliegue en la plataforma Vercel operativo y sin errores de compilación.</w:t></w:r></w:p>

    <w:p>
      <w:pPr><w:spacing w:before="180" w:after="100"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>Historias de Usuario (Product Backlog)</w:t>
      </w:r>
    </w:p>

    <!-- TABLA DE HISTORIAS DE USUARIO -->
    <w:tbl>
      <w:tblPr>
        <w:tblW w:w="9200" w:type="dxa"/>
        <w:tblBorders>
          <w:top w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:left w:val="none"/>
          <w:bottom w:val="single" w:sz="6" w:space="0" w:color="CBD5E1"/>
          <w:right w:val="none"/>
          <w:insideH w:val="single" w:sz="4" w:space="0" w:color="E2E8F0"/>
          <w:insideV w:val="none"/>
        </w:tblBorders>
      </w:tblPr>
      <!-- HEADER -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="1200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>ID</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4200" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Historia de Usuario (Como / Quiero / Para)</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/><w:shd w:val="clear" w:color="auto" w:fill="0F172A"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="FFFFFF"/></w:rPr><w:t>Criterios de Aceptación</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- HU 1 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="C8102E"/></w:rPr><w:t>HU-01</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Consulta de Trámites y Requisitos</w:t></w:r></w:p>
          <w:p><w:r><w:t>Como ciudadano, quiero consultar los trámites bancarios y sus requisitos obligatorios en la web pública, para preparar mi documentación antes de acudir a la agencia.</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>1. Buscador interactivo por nombre de trámite.</w:t></w:r></w:p>
          <w:p><w:r><w:t>2. Visualización de lista clara de documentos obligatorios.</w:t></w:r></w:p>
          <w:p><w:r><w:t>3. Acceso 100% público sin requerir inicio de sesión previo.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- HU 2 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="C8102E"/></w:rPr><w:t>HU-02</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Reserva Concurrente de Cita con QR</w:t></w:r></w:p>
          <w:p><w:r><w:t>Como cliente, quiero seleccionar una sede bancaria, trámite y fecha/hora para reservar mi atención, recibiendo un comprobante digital con código QR.</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>1. Selección dinámica de agencia y horarios disponibles.</w:t></w:r></w:p>
          <w:p><w:r><w:t>2. Bloqueo transaccional de cupo vía función SQL 'reservar_cita()'.</w:t></w:r></w:p>
          <w:p><w:r><w:t>3. Generación y renderizado en pantalla de código QR único.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- HU 3 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="C8102E"/></w:rPr><w:t>HU-03</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Panel de Ventanilla y Validación</w:t></w:r></w:p>
          <w:p><w:r><w:t>Como agente bancario, quiero ver las citas asignadas a mi ventanilla, llamar al ciudadano y validar sus documentos para registrar la atención.</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>1. Filtro en vivo de citas asignadas a la ventanilla.</w:t></w:r></w:p>
          <w:p><w:r><w:t>2. Checklist de verificación de documentos del trámite.</w:t></w:r></w:p>
          <w:p><w:r><w:t>3. Transición de estados: Pendiente -&gt; En Atención -&gt; Atendida.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
      <!-- HU 4 -->
      <w:tr>
        <w:tc>
          <w:tcPr><w:tcW w:w="1200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/><w:color w:val="C8102E"/></w:rPr><w:t>HU-04</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="4200" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:rPr><w:b/></w:rPr><w:t>Control de Acceso Basado en Roles (RBAC)</w:t></w:r></w:p>
          <w:p><w:r><w:t>Como administrador general, quiero gestionar permisos y segregar los accesos a los módulos según el rol del usuario, para salvaguardar la seguridad bancaria.</w:t></w:r></w:p>
        </w:tc>
        <w:tc>
          <w:tcPr><w:tcW w:w="3800" w:type="dxa"/></w:tcPr>
          <w:p><w:r><w:t>1. Soporte de 4 roles: Cliente, Ventanilla, Admin Agencia y Admin General.</w:t></w:r></w:p>
          <w:p><w:r><w:t>2. Redirección y restricción de rutas vía middleware.</w:t></w:r></w:p>
          <w:p><w:r><w:t>3. Seguridad de datos garantizada a nivel de base de datos con RLS.</w:t></w:r></w:p>
        </w:tc>
      </w:tr>
    </w:tbl>

    <!-- 4.4 EVIDENCIA DE GESTIÓN ÁGIL -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="600" w:after="200"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="C8102E"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4.4 Evidencia de Gestión Ágil</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Herramienta de Tablero Ágil: </w:t>
      </w:r>
      <w:r>
        <w:t>GitHub Projects / Jira Software</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Ciclos de Desarrollo (Sprints): </w:t>
      </w:r>
      <w:r>
        <w:t>Sprints de 2 semanas con reuniones diarias (Dailies) y retrospectivas al cierre.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Estados del Tablero Kanban: </w:t>
      </w:r>
      <w:r>
        <w:t>Product Backlog -&gt; Sprint Backlog -&gt; In Progress -&gt; Code Review / QA -&gt; Done.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>Historial y Resultados por Sprint:</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Sprint 1 (Infraestructura y Portal Público): </w:t></w:r>
      <w:r><w:t>Implementación del esquema de base de datos relacional en Supabase, configuración de Clean Architecture en Next.js y entrega de la Landing Page con buscador de trámites (HU-01 completada al 100%).</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Sprint 2 (Motor de Citas y Seguridad RBAC): </w:t></w:r>
      <w:r><w:t>Desarrollo del flujo interactivo de agendamiento (/agendar), bloqueo concurrente en PostgreSQL y autenticación con Supabase Auth SSR (HU-02 y HU-04 completadas al 100%).</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Sprint 3 (Módulo Ventanilla y Despliegue): </w:t></w:r>
      <w:r><w:t>Panel de atención para el agente de ventanilla, checklist de requisitos, panel de administración y despliegue final en producción en Vercel (HU-03 completada al 100%).</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="120" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:i/><w:color w:val="64748B"/></w:rPr>
        <w:t>[Nota para el informe: Inserte aquí las capturas de pantalla de su tablero de GitHub Projects o Jira mostrando las tarjetas en columna 'Done' y los commits del repositorio].</w:t>
      </w:r>
    </w:p>

    <!-- 4.5 DEMOSTRACIÓN DEL INCREMENTO -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="600" w:after="200"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="C8102E"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4.5 Demostración del Incremento</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Repositorio Oficial: </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:color w:val="0284C7"/><w:u w:val="single"/></w:rPr>
        <w:t>https://github.com/CruzGonzalesLeonardo/Agendamineto_Web</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r>
        <w:rPr><w:b/></w:rPr>
        <w:t>• Despliegue en la Nube (Vercel): </w:t>
      </w:r>
      <w:r>
        <w:rPr><w:color w:val="0284C7"/><w:u w:val="single"/></w:rPr>
        <w:t>https://agendamiento-web.vercel.app</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>Interfaces Clave del Incremento:</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>1. Portal Público (/): </w:t></w:r>
      <w:r><w:t>Landing page institucional con paleta del Banco de la Nación, buscador de trámites y directorio de agencias con horarios de atención.</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>2. Flujo de Reserva (/agendar): </w:t></w:r>
      <w:r><w:t>Formulario guiado de selección de sede, servicio y turno, finalizando con la generación de credencial y código QR digital.</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>3. Módulo de Ventanilla (/ventanilla): </w:t></w:r>
      <w:r><w:t>Panel en tiempo real para el agente del banco, con llamado de turnos, verificación de requisitos documentarios y cierre de atención.</w:t></w:r>
    </w:p>

    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>4. Módulo de Auditoría y Administración (/admin-general y /admin-agencia): </w:t></w:r>
      <w:r><w:t>Control de ventanillas activas, trazabilidad de citas por agencia y control de accesos RBAC.</w:t></w:r>
    </w:p>

    <!-- 4.6 RETROSPECTIVA Y CONCLUSIONES -->
    <w:p>
      <w:pPr>
        <w:spacing w:before="600" w:after="200"/>
        <w:pBdr>
          <w:bottom w:val="single" w:sz="12" w:space="4" w:color="C8102E"/>
        </w:pBdr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="32"/>
          <w:color w:val="0F172A"/>
        </w:rPr>
        <w:t>4.6 Retrospectiva y Conclusiones</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>1. Balance de Cumplimiento</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>El equipo completó con éxito el 100% de las Historias de Usuario planificadas para el MVP. La coordinación Scrum permitió entregas incrementales verificables al final de cada Sprint, garantizando que el núcleo de la aplicación estuviese probado antes de avanzar a la capa visual.</w:t>
      </w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>2. Dificultades Técnicas Resueltas</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Manejo de concurrencia en turnos: </w:t></w:r>
      <w:r><w:t>Se resolvió mediante una función almacenada en PostgreSQL ('reservar_cita') con cláusula FOR UPDATE, evitando que dos usuarios agenden el mismo cupo en milisegundos idénticos.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Gestión de sesiones seguras en Next.js App Router: </w:t></w:r>
      <w:r><w:t>Se solucionó implementando la suite '@supabase/ssr' para sincronizar cookies de sesión seguras entre Client Components y Server Components.</w:t></w:r>
    </w:p>

    <w:p>
      <w:pPr><w:spacing w:before="160" w:after="80"/></w:pPr>
      <w:r>
        <w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="9A0B22"/></w:rPr>
        <w:t>3. Lecciones Aprendidas</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Valor de la Arquitectura Limpia: </w:t></w:r>
      <w:r><w:t>Aislar el dominio de las librerías externas facilitó el desarrollo en paralelo de los 4 integrantes del equipo sin conflictos de código.</w:t></w:r>
    </w:p>
    <w:p>
      <w:r><w:rPr><w:b/></w:rPr><w:t>• Rigor en el DoD: </w:t></w:r>
      <w:r><w:t>La definición clara de 'Terminado' redujo al mínimo la acumulación de deuda técnica y garantizó una versión final lista para producción.</w:t></w:r>
    </w:p>

  </w:body>
</w:document>
'@
[System.IO.File]::WriteAllText((Join-Path $tempDir "word\document.xml"), $document, [System.Text.Encoding]::UTF8)

# Comprimir a archivo docx
if (Test-Path $outputPath) {
    Remove-Item $outputPath -Force
}

[System.IO.Compression.ZipFile]::CreateFromDirectory($tempDir, $outputPath)
Remove-Item -Recurse -Force $tempDir

Write-Host "Archivo generado exitosamente en: $outputPath"
