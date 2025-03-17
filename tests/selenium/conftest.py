import pytest
from selenium import webdriver
from selenium.webdriver.chrome.service import Service
from webdriver_manager.chrome import ChromeDriverManager
from selenium.webdriver.chrome.options import Options

@pytest.fixture(scope="function")
def driver():
    """
    Fixture que proporciona un navegador Chrome configurado para las pruebas.
    Se ejecuta antes de cada prueba y se cierra después.
    """
    # Configurar opciones de Chrome
    chrome_options = Options()
    # chrome_options.add_argument("--headless")  # Descomentar para ejecutar sin interfaz gráfica
    chrome_options.add_argument("--window-size=1920,1080")
    
    # Inicializar el driver
    driver = webdriver.Chrome(service=Service(ChromeDriverManager().install()), options=chrome_options)
    driver.implicitly_wait(10)  # Espera implícita para que los elementos aparezcan
    
    # Entregar el driver a la prueba
    yield driver
    
    # Cerrar el navegador después de la prueba
    driver.quit()