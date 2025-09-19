const API_URL = 'https://68b8836db71540504328723b.mockapi.io/test_iot/localizador_iot';

document.addEventListener('DOMContentLoaded', () => {
    const dispositivoForm = document.getElementById('dispositivoForm');
    const registrosTableBody = document.getElementById('registrosTableBody');
    const controlTableBody = document.getElementById('controlTableBody');
    const alertContainer = document.getElementById('alertContainer');

    // Botones de la página de pruebas
    const inactivoARecorridoBtn = document.getElementById('inactivoARecorridoBtn');
    const actualizarUbicacionBtn = document.getElementById('actualizarUbicacionBtn');
    const recorridoARecepcionBtn = document.getElementById('recorridoARecepcionBtn');
    const recorridoAVulneradoBtn = document.getElementById('recorridoAVulneradoBtn');

    // Función para mostrar mensajes de alerta
    const showAlert = (message, type, container) => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        `;
        container.innerHTML = '';
        container.appendChild(alertDiv);
    };

    // Función para obtener y mostrar los últimos registros
    const fetchAndDisplayRecords = async (limit, tableBody) => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) {
                throw new Error('Error al obtener los datos de la API.');
            }
            const data = await response.json();
            
            // Ordena por id en orden descendente para mostrar los más recientes
            const sortedData = data.sort((a, b) => b.id - a.id); 
            const recentRecords = sortedData.slice(0, limit);

            tableBody.innerHTML = ''; // Limpiar la tabla antes de rellenarla
            
            if (recentRecords.length > 0) {
                recentRecords.forEach(record => {
                    const row = document.createElement('tr');
                    
                    // Asignar clase de color según el estado
                    let statusClass = '';
                    switch (record.status) {
                        case 'en recorrido':
                            statusClass = 'estado-en-recorrido';
                            break;
                        case 'vulnerado':
                            statusClass = 'estado-vulnerado';
                            break;
                        case 'en recepción':
                            statusClass = 'estado-en-recepcion';
                            break;
                        case 'Recibido':
                            statusClass = 'estado-recibido';
                            break;
                        case 'inactivo':
                        default:
                            statusClass = 'estado-inactivo';
                            break;
                    }
                    row.className = statusClass;
                    
                    let actionsCellContent = '';

                    // Lógica para los botones de "Confirmar Recepción" e "Invalidar"
                    if (tableBody.id === 'controlTableBody') {
                        if (record.status === 'en recepción') {
                             actionsCellContent += `<button class="btn btn-success btn-sm me-2 confirmar-recepcion-btn" data-id="${record.id}">Confirmar Recepción</button>`;
                        }
                        actionsCellContent += `<button class="btn btn-danger btn-sm invalidar-btn" data-id="${record.id}">Invalidar</button>`;
                    }

                    // Dependiendo de la página, muestra diferentes datos
                    if (tableBody.id === 'registrosTableBody') {
                        row.innerHTML = `
                            <td>${record.device_id || 'N/A'}</td>
                            <td>${record.cae || 'N/A'}</td>
                            <td>${record.electoral_zone || 'N/A'}</td>
                            <td>${record.package_number || 'N/A'}</td>
                            <td>${record.status || 'N/A'}</td>
                            <td>${record.adress || 'N/A'}</td>
                        `;
                    } else if (tableBody.id === 'controlTableBody') {
                        row.innerHTML = `
                            <td>${record.id || 'N/A'}</td>
                            <td>${record.cae || 'N/A'}</td>
                            <td>${record.electoral_zone || 'N/A'}</td>
                            <td>${record.package_number || 'N/A'}</td>
                            <td>${record.status || 'N/A'}</td>
                            <td>${record.adress || 'N/A'}</td>
                            <td>${new Date(record.date).toLocaleDateString()}</td>
                            <td>${actionsCellContent}</td>
                        `;
                    }
                    tableBody.appendChild(row);
                });

                // Añadir los listeners para los botones después de que la tabla se ha rellenado
                if (tableBody.id === 'controlTableBody') {
                    document.querySelectorAll('.confirmar-recepcion-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const deviceId = e.target.dataset.id;
                            try {
                                const response = await fetch(`${API_URL}/${deviceId}`, {
                                    method: 'PUT',
                                    headers: {
                                        'Content-Type': 'application/json'
                                    },
                                    body: JSON.stringify({ status: 'Recibido' })
                                });

                                if (!response.ok) {
                                    throw new Error('Error al confirmar la recepción del dispositivo.');
                                }

                                showAlert(`Dispositivo ${deviceId} confirmado como "Recibido".`, 'success', alertContainer);
                                location.reload(); // Refresca la página para mostrar el cambio
                            } catch (error) {
                                console.error('Error:', error);
                                showAlert('Error al confirmar la recepción. Inténtelo de nuevo.', 'danger', alertContainer);
                            }
                        });
                    });

                    document.querySelectorAll('.invalidar-btn').forEach(button => {
                        button.addEventListener('click', async (e) => {
                            const deviceId = e.target.dataset.id;
                            const confirmation = confirm('¿Estás seguro de querer invalidar este dispositivo?');
                            
                            if (confirmation) {
                                const password = prompt('Por favor, introduce la contraseña para continuar:');
                                if (password === 'prueba123') {
                                    try {
                                        const response = await fetch(`${API_URL}/${deviceId}`, {
                                            method: 'DELETE'
                                        });

                                        if (!response.ok) {
                                            throw new Error('Error al eliminar el dispositivo.');
                                        }

                                        showAlert(`Dispositivo ${deviceId} ha sido invalidado y eliminado con éxito.`, 'success', alertContainer);
                                        location.reload();
                                    } catch (error) {
                                        console.error('Error:', error);
                                        showAlert('Error al invalidar el dispositivo. Inténtelo de nuevo.', 'danger', alertContainer);
                                    }
                                } else {
                                    showAlert('Contraseña incorrecta. Operación cancelada.', 'warning', alertContainer);
                                }
                            }
                        });
                    });
                }

            } else {
                tableBody.innerHTML = '<tr><td colspan="5" class="text-center">No hay registros disponibles.</td></tr>';
            }
            
        } catch (error) {
            console.error('Error:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="5" class="text-center text-danger">Error al cargar los datos. Por favor, inténtelo de nuevo.</td></tr>`;
            }
        }
    };

    // Lógica para la página de alta de dispositivos (index.html)
    if (dispositivoForm) {
        dispositivoForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const deviceId = document.getElementById('deviceId').value;
            const caeName = document.getElementById('caeName').value;
            const electoralZone = document.getElementById('electoralZone').value;
            const packageNumber = document.getElementById('packageNumber').value;

            const newDevice = {
                device_id: deviceId,
                cae: caeName,
                electoral_zone: electoralZone,
                package_number: packageNumber,
                status: 'inactivo',
                adress: 'Sin ubicación registrada',
                date: new Date().toISOString()
            };

            try {
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(newDevice)
                });

                if (!response.ok) {
                    throw new Error('Error al registrar el dispositivo.');
                }

                showAlert('Dispositivo registrado con éxito.', 'success', alertContainer);
                dispositivoForm.reset();
                fetchAndDisplayRecords(5, registrosTableBody); // Actualiza la tabla
                
            } catch (error) {
                console.error('Error:', error);
                showAlert('Error al registrar el dispositivo. Inténtelo de nuevo.', 'danger', alertContainer);
            }
        });

        fetchAndDisplayRecords(5, registrosTableBody);
    }

    // Lógica para la página de control (control.html)
    if (controlTableBody) {
        fetchAndDisplayRecords(10, controlTableBody);
        setInterval(() => fetchAndDisplayRecords(10, controlTableBody), 2000); // Refresca cada 2 segundos
    }

    // Lógica para la página de pruebas (pruebas.html)
    if (inactivoARecorridoBtn) {
        // Función para cambiar el estado de "inactivo" a "en recorrido" (solo uno)
        inactivoARecorridoBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(API_URL);
                const devices = await response.json();
                const inactiveDevices = devices.filter(d => d.status === 'inactivo');

                if (inactiveDevices.length > 0) {
                    const deviceToUpdate = inactiveDevices[0]; // Selecciona solo el primero
                    await fetch(`${API_URL}/${deviceToUpdate.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'en recorrido' })
                    });
                    showAlert(`Se actualizó el dispositivo ${deviceToUpdate.id} a "en recorrido".`, 'success', alertContainer);
                } else {
                    showAlert('No se encontraron dispositivos con estado "inactivo".', 'info', alertContainer);
                }
            } catch (error) {
                console.error('Error al actualizar el estado:', error);
                showAlert('Error al actualizar el dispositivo.', 'danger', alertContainer);
            }
        });

        // Función para cambiar la ubicación de un dispositivo aleatorio cada 15s
        let intervalId = null;
        actualizarUbicacionBtn.addEventListener('click', async () => {
            if (intervalId) {
                clearInterval(intervalId);
                intervalId = null;
                actualizarUbicacionBtn.textContent = 'Iniciar Actualización de Ubicación (15s)';
                showAlert('Actualización de ubicación detenida.', 'warning', alertContainer);
                return;
            }

            actualizarUbicacionBtn.textContent = 'Detener Actualización de Ubicación';
            showAlert('Actualización de ubicación iniciada. Se actualizará cada 15 segundos.', 'info', alertContainer);

            const updateRandomLocation = async () => {
                try {
                    const response = await fetch(API_URL);
                    const devices = await response.json();
                    
                    if (devices.length > 0) {
                        const randomDevice = devices[Math.floor(Math.random() * devices.length)];
                        
                        // Generar una ubicación aleatoria simple (simulada)
                        const newAddress = `Lat: ${Math.random().toFixed(4)}, Lon: ${Math.random().toFixed(4)}`;
                        
                        await fetch(`${API_URL}/${randomDevice.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({ adress: newAddress })
                        });
                        showAlert(`Ubicación de dispositivo ${randomDevice.id} actualizada a: ${newAddress}`, 'success', alertContainer);
                    } else {
                        showAlert('No hay dispositivos para actualizar.', 'info', alertContainer);
                        clearInterval(intervalId);
                        actualizarUbicacionBtn.textContent = 'Iniciar Actualización de Ubicación (15s)';
                    }
                } catch (error) {
                    console.error('Error al actualizar la ubicación:', error);
                    showAlert('Error al actualizar la ubicación. Se detendrá la simulación.', 'danger', alertContainer);
                    clearInterval(intervalId);
                    actualizarUbicacionBtn.textContent = 'Iniciar Actualización de Ubicación (15s)';
                }
            };
            
            updateRandomLocation(); // Llama inmediatamente
            intervalId = setInterval(updateRandomLocation, 15000);
        });

        // Función para cambiar el estado de "en recorrido" a "en recepción" (solo uno, aleatorio)
        recorridoARecepcionBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(API_URL);
                const devices = await response.json();
                const devicesInRoute = devices.filter(d => d.status === 'en recorrido');

                if (devicesInRoute.length > 0) {
                    const randomIndex = Math.floor(Math.random() * devicesInRoute.length);
                    const deviceToUpdate = devicesInRoute[randomIndex]; // Selecciona uno aleatoriamente
                    await fetch(`${API_URL}/${deviceToUpdate.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'en recepción' })
                    });
                    showAlert(`Se actualizó el dispositivo ${deviceToUpdate.id} a "en recepción".`, 'success', alertContainer);
                } else {
                    showAlert('No se encontraron dispositivos con estado "en recorrido".', 'info', alertContainer);
                }
            } catch (error) {
                console.error('Error al actualizar el estado:', error);
                showAlert('Error al actualizar el dispositivo.', 'danger', alertContainer);
            }
        });
        
        // Función para cambiar el estado de "en recorrido" a "vulnerado" (solo uno)
        recorridoAVulneradoBtn.addEventListener('click', async () => {
            try {
                const response = await fetch(API_URL);
                const devices = await response.json();
                const devicesInRoute = devices.filter(d => d.status === 'en recorrido');

                if (devicesInRoute.length > 0) {
                    const deviceToUpdate = devicesInRoute[0]; // Selecciona solo el primero
                    await fetch(`${API_URL}/${deviceToUpdate.id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ status: 'vulnerado' })
                    });
                    showAlert(`Se actualizó el dispositivo ${deviceToUpdate.id} a "vulnerado".`, 'danger', alertContainer);
                } else {
                    showAlert('No se encontraron dispositivos con estado "en recorrido".', 'info', alertContainer);
                }
            } catch (error) {
                console.error('Error al actualizar el estado:', error);
                showAlert('Error al actualizar el dispositivo.', 'danger', alertContainer);
            }
        });
    }
});