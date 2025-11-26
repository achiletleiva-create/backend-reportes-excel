// const API_BASE_URL = 'http://localhost:3000';  <-- Esta ya no
const API_BASE_URL = 'https://backend-reportes-excel.onrender.com';

const $ = (selector) => document.querySelector(selector);

const form = $('#reporte-form');
const formStatus = $('#form-status');
const reportesBody = $('#reportes-body');
const reportesStatus = $('#reportes-status');
const refreshButton = $('#refresh-reportes');

const formatDateTime = (isoString) => {
  if (!isoString) return '-';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return isoString;
  return date.toLocaleString();
};

const setStatus = (element, message, type = '') => {
  element.textContent = message;
  element.className = `status ${type}`;
};

const fetchReportes = async () => {
  setStatus(reportesStatus, 'Cargando reportes...');
  try {
    const response = await fetch(`${API_BASE_URL}/api/reportes`);
    if (!response.ok) {
      throw new Error(`Error HTTP ${response.status}`);
    }
    const data = await response.json();
    renderReportes(data.data || []);
    setStatus(reportesStatus, `Total: ${data.total || 0} reporte(s)`, 'success');
  } catch (error) {
    console.error(error);
    setStatus(reportesStatus, 'No se pudieron cargar los reportes', 'error');
    reportesBody.innerHTML = `<tr><td colspan="5" class="text-center">Error cargando datos</td></tr>`;
  }
};

const renderReportes = (reportes) => {
  if (!reportes.length) {
    reportesBody.innerHTML = `<tr><td colspan="5" class="text-center">Sin reportes guardados</td></tr>`;
    return;
  }

  reportesBody.innerHTML = reportes
    .map((reporte) => {
      const descarga =
        reporte.archivo_excel && reporte.archivo_excel !== 'null'
          ? `<a href="${API_BASE_URL}/reports/${reporte.archivo_excel}" target="_blank">Descargar</a>`
          : '-';
      return `
        <tr>
          <td>${reporte.id}</td>
          <td>${reporte.nombre || '-'}</td>
          <td>${reporte.estado || '-'}</td>
          <td>${descarga}</td>
          <td>${formatDateTime(reporte.created_at)}</td>
        </tr>
      `;
    })
    .join('');
};

const handleSubmit = async (event) => {
  event.preventDefault();
  setStatus(formStatus, 'Enviando reporte...', ''); 

  const formData = new FormData(form);
  const nombreReporte = formData.get('nombreReporte');
  const fecha = formData.get('fecha');
  const descripcion = formData.get('descripcion');
  const celdaTitulo = formData.get('celdaTitulo');
  const celdaDescripcion = formData.get('celdaDescripcion');
  const celdaFoto = formData.get('celdaFoto');
  const foto = formData.get('foto1');

  if (!foto || !foto.size) {
    setStatus(formStatus, 'Debes seleccionar una imagen', 'error');
    return;
  }

  const datos = {
    nombreReporte,
    guardarEnBD: true,
    celdas: {
      [celdaTitulo]: `${nombreReporte} (${fecha})`,
      [celdaDescripcion]: descripcion,
    },
    celdasFotos: {
      foto1: celdaFoto,
    },
  };

  const payload = new FormData();
  payload.append('datos', JSON.stringify(datos));
  payload.append('foto1', foto);

  try {
    const response = await fetch(`${API_BASE_URL}/api/generar-reporte`, {
      method: 'POST',
      body: payload,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.mensaje || `Error HTTP ${response.status}`);
    }

    const result = await response.json();
    const linkDescarga = `${API_BASE_URL}${result.ruta}`;
    setStatus(
      formStatus,
      `Reporte generado correctamente. Descarga aquí: `,
      'success'
    );

    formStatus.innerHTML = `
      ✅ Reporte generado CHILET DE CHILETES. 
      <a href="${linkDescarga}" target="_blank" rel="noopener">Descargar Excel</a>
    `;

    form.reset();
    fetchReportes();
  } catch (error) {
    console.error(error);
    setStatus(formStatus, `Error: ${error.message}`, 'error');
  }
};

form.addEventListener('submit', handleSubmit);
refreshButton.addEventListener('click', fetchReportes);

fetchReportes();



