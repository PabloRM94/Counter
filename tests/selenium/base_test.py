from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import TimeoutException

class BaseTest:
    """Clase base para todas las pruebas de Selenium"""
    
    def __init__(self, driver):
        """
        Inicializa la clase base con el driver de Selenium
        
        Args:
            driver: Instancia del WebDriver de Selenium
        """
        self.driver = driver
        # URL base de la aplicación (ajustar según tu entorno)
        self.base_url = "http://localhost:5500"
    
    def open_home_page(self):
        """
        Abre la página principal de la aplicación
        """
        self.driver.get(self.base_url)
    
    def wait_for_element(self, locator, timeout=10):
        """
        Espera a que un elemento esté presente en la página
        
        Args:
            locator: Tupla (By.XXX, "selector")
            timeout: Tiempo máximo de espera en segundos
            
        Returns:
            El elemento web si se encuentra
            
        Raises:
            TimeoutException si el elemento no aparece
        """
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.presence_of_element_located(locator)
            )
            return element
        except TimeoutException:
            print(f"Elemento no encontrado: {locator}")
            raise
    
    def wait_for_element_clickable(self, locator, timeout=10):
        """
        Espera a que un elemento esté presente y se pueda hacer clic en él
        
        Args:
            locator: Tupla (By.XXX, "selector")
            timeout: Tiempo máximo de espera en segundos
            
        Returns:
            El elemento web si se encuentra y es clickable
            
        Raises:
            TimeoutException si el elemento no es clickable
        """
        try:
            element = WebDriverWait(self.driver, timeout).until(
                EC.element_to_be_clickable(locator)
            )
            return element
        except TimeoutException:
            print(f"Elemento no clickable: {locator}")
            raise