import pytest
from selenium.webdriver.common.by import By
from base_test import BaseTest

class TestAuth(BaseTest):
    """Pruebas para la funcionalidad de autenticación"""
    
    def __init__(self, driver):
        """
        Inicializa la clase de prueba con el driver y define los selectores
        
        Args:
            driver: Instancia del WebDriver de Selenium
        """
        super().__init__(driver)
        # Selectores de elementos de autenticación
        self.login_email_input = (By.ID, "loginEmail")
        self.login_password_input = (By.ID, "loginPassword")
        self.login_button = (By.ID, "loginButton")
        self.register_button = (By.ID, "switchToRegister")
        self.register_email_input = (By.ID, "registerEmail")
        self.register_password_input = (By.ID, "registerPassword")
        self.register_submit_button = (By.ID, "registerButton")
        self.switch_to_login = (By.ID, "switchToLogin")
        self.counter_section = (By.ID, "counterSection")
        self.auth_logo = (By.CLASS_NAME, "auth-logo")
        
    def test_page_load(self):
        """
        Verifica que la página se carga correctamente y muestra el logo
        """
        # Abrir la página principal
        self.open_home_page()
        
        # Verificar que el logo está presente
        logo = self.wait_for_element(self.auth_logo)
        assert logo.is_displayed(), "El logo de la aplicación no se muestra"
        
        # Verificar el título de la página
        assert "Mis Contadores" in self.driver.title, "El título de la página no es correcto"
        
    def test_login_form_display(self):
        """
        Verifica que el formulario de login se muestre correctamente
        """
        self.open_home_page()
        
        # Verificar que los elementos del formulario de login están presentes
        assert self.wait_for_element(self.login_email_input).is_displayed(), "Campo de email no visible"
        assert self.wait_for_element(self.login_password_input).is_displayed(), "Campo de contraseña no visible"
        assert self.wait_for_element(self.login_button).is_displayed(), "Botón de login no visible"
        assert self.wait_for_element(self.register_button).is_displayed(), "Botón de registro no visible"
    
    def test_switch_to_register(self):
        """
        Verifica que se pueda cambiar al formulario de registro
        """
        self.open_home_page()
        
        # Hacer clic en el botón para cambiar al registro
        self.wait_for_element_clickable(self.register_button).click()
        
        # Verificar que los elementos del formulario de registro están presentes
        assert self.wait_for_element(self.register_email_input).is_displayed(), "Campo de email de registro no visible"
        assert self.wait_for_element(self.register_password_input).is_displayed(), "Campo de contraseña de registro no visible"
        assert self.wait_for_element(self.register_submit_button).is_displayed(), "Botón de envío de registro no visible"

# Configuración para ejecutar las pruebas con pytest
@pytest.fixture
def auth_test(driver):
    """
    Fixture que proporciona una instancia de TestAuth
    
    Args:
        driver: Fixture que proporciona el WebDriver
        
    Returns:
        Instancia de TestAuth
    """
    return TestAuth(driver)

def test_page_load(auth_test):
    """
    Ejecuta la prueba de carga de página
    
    Args:
        auth_test: Fixture que proporciona una instancia de TestAuth
    """
    auth_test.test_page_load()

def test_login_form_display(auth_test):
    """
    Ejecuta la prueba de visualización del formulario de login
    
    Args:
        auth_test: Fixture que proporciona una instancia de TestAuth
    """
    auth_test.test_login_form_display()

def test_switch_to_register(auth_test):
    """
    Ejecuta la prueba de cambio al formulario de registro
    
    Args:
        auth_test: Fixture que proporciona una instancia de TestAuth
    """
    auth_test.test_switch_to_register()

#cd d:\Trae\Counter
#.venv\Scripts\activate
#pytest tests\selenium\test_auth.py -v
