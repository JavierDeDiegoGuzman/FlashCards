#!/usr/bin/env python3
"""
PDF to Test Questions Converter

Genera preguntas tipo test a partir de un archivo PDF.

Requisitos:
1. Crear un entorno virtual:
   python3 -m venv venv

2. Activar el entorno virtual:
   En Linux/Mac: source venv/bin/activate
   En Windows: .\venv\Scripts\activate

3. Instalar dependencias:
   pip install PyPDF2 openai

Uso:
   python script.py <ruta_del_pdf>

Ejemplo:
   python script.py documento.pdf

El script generará un archivo JSON con el mismo nombre que el PDF
pero con el sufijo '_test.json' conteniendo las preguntas generadas.
"""

import os
import json
import sys
from datetime import datetime

try:
    import PyPDF2
    from openai import OpenAI
except ImportError:
    print("ERROR: Faltan dependencias requeridas.")
    print("Por favor, sigue estos pasos:")
    print("\n1. Crear un entorno virtual:")
    print("   python3 -m venv venv")
    print("\n2. Activar el entorno virtual:")
    print("   En Linux/Mac: source venv/bin/activate")
    print("   En Windows: .\\venv\\Scripts\\activate")
    print("\n3. Instalar dependencias:")
    print("   pip install PyPDF2 openai")
    sys.exit(1)

def log_message(message):
    """Función para imprimir mensajes de debug con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def extract_text_from_pdf(pdf_path):
    """Extrae texto de un archivo PDF y lo devuelve como una lista de páginas."""
    log_message(f"Iniciando extracción de texto del archivo: {pdf_path}")
    pages_text = []
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            log_message(f"Total de páginas encontradas: {total_pages}")
            
            for page_num in range(total_pages):
                log_message(f"Procesando página {page_num + 1}/{total_pages}")
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text.strip():  # Solo añadir páginas que contengan texto
                    pages_text.append(text)
                
    except FileNotFoundError:
        log_message(f"ERROR: Archivo no encontrado en {pdf_path}")
        return None
    except Exception as e:
        log_message(f"ERROR: Error al procesar el PDF: {e}")
        return None

    log_message(f"Texto extraído exitosamente de {pdf_path}")
    log_message(f"Páginas con contenido extraídas: {len(pages_text)}")
    return pages_text

def generate_summary(pages_text, api_key):
    """Genera un resumen del texto completo usando ChatGPT."""
    log_message("Iniciando generación del resumen")
    
    client = OpenAI(api_key=api_key)
    full_text = "\n".join(pages_text)
    
    try:
        log_message("Enviando solicitud a OpenAI para generar resumen...")
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Eres un asistente experto en resumir textos. Genera un resumen conciso pero completo del siguiente texto, capturando los puntos más importantes."
                },
                {
                    "role": "user",
                    "content": full_text
                }
            ],
            temperature=0.5
        )
        summary = response.choices[0].message.content
        log_message("Resumen generado exitosamente")
        return summary
        
    except Exception as e:
        log_message(f"ERROR: Error al generar el resumen: {e}")
        return None

def generate_test_questions(pages_text, context, api_key, batch_size=3):
    system_prompt = """Eres un profesor experto que debe crear preguntas tipo test. 
    Para cada fragmento de texto, genera preguntas que cumplan EXACTAMENTE este formato JSON:
    [
      {
        "front": "Pregunta clara y específica",
        "back": "Respuesta correcta",
        "wrongOptions": [
          "Primera opción incorrecta pero plausible",
          "Segunda opción incorrecta pero plausible"
        ]
      }
    ]

    REGLAS IMPORTANTES:
    1. Cada pregunta debe ser clara y específica
    2. La respuesta correcta debe ser inequívoca
    3. Las opciones incorrectas deben ser plausibles pero claramente incorrectas
    4. SIEMPRE incluye exactamente DOS opciones incorrectas
    5. Mantén el formato JSON exacto
    6. Asegúrate de cubrir los conceptos más importantes del texto
    7. Las preguntas deben evaluar comprensión, no solo memorización"""
    client = OpenAI(api_key=api_key)
    all_flashcards = []
    max_retries = 3  # Número máximo de intentos por batch
    
    # Añadir validación inicial
    if not pages_text:
        log_message("ERROR: No hay texto para procesar")
        return all_flashcards

    # Añadir un límite máximo de batches para evitar bucles infinitos
    max_batches = (len(pages_text) // batch_size) + 1
    
    for i in range(0, len(pages_text), batch_size):
        batch_pages = pages_text[i:i + batch_size]
        batch_text = "\n".join(batch_pages)
        
        log_message(f"\n--- Procesando batch {i//batch_size + 1}/{max_batches} ---")
        
        # Control de longitud del texto
        if len(batch_text) > 12000:  # Limitar longitud del texto
            batch_text = batch_text[:12000]
            log_message("Texto truncado por longitud excesiva")

        retry_count = 0
        while retry_count < max_retries:
            try:
                response = client.chat.completions.create(
                    model="gpt-3.5-turbo-16k",
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": f"Genera flashcards en formato JSON válido para este texto:\n\n{batch_text}"}
                    ],
                    temperature=0.7,
                    max_tokens=4000,
                    presence_penalty=0.5,
                    frequency_penalty=0.3
                )
                
                # Validar que la respuesta es JSON válido
                content = response.choices[0].message.content
                try:
                    batch_flashcards = json.loads(content)
                    if not isinstance(batch_flashcards, list):
                        raise ValueError("La respuesta no es una lista JSON válida")
                        
                    # Validar flashcards
                    valid_flashcards = []
                    for flashcard in batch_flashcards:
                        if (isinstance(flashcard, dict) and
                            all(key in flashcard for key in ['front', 'back', 'wrongOptions']) and
                            isinstance(flashcard['wrongOptions'], list) and
                            len(flashcard['wrongOptions']) == 2):
                            valid_flashcards.append(flashcard)
                    
                    all_flashcards.extend(valid_flashcards)
                    log_message(f"Flashcards válidas en este batch: {len(valid_flashcards)}")
                    break  # Salir del bucle de reintentos si todo fue bien
                    
                except json.JSONDecodeError as e:
                    log_message(f"Error en formato JSON (intento {retry_count + 1}): {e}")
                    retry_count += 1
                    
            except Exception as e:
                log_message(f"Error en la API (intento {retry_count + 1}): {e}")
                retry_count += 1
                
        if retry_count >= max_retries:
            log_message(f"Saltando batch {i//batch_size + 1} después de {max_retries} intentos fallidos")
            
        # Verificar si ya hemos procesado suficientes flashcards
        if len(all_flashcards) >= 100:  # Límite arbitrario
            log_message("Se alcanzó el límite máximo de flashcards")
            break

    log_message(f"\nTotal de flashcards generadas: {len(all_flashcards)}")
    return all_flashcards

def main():
    # Verificar que se proporcione el argumento del archivo PDF
    if len(sys.argv) != 2:
        print("Error: Se requiere la ruta del archivo PDF como argumento")
        print("Uso: python script.py <ruta_del_pdf>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    
    # Verificar que el archivo existe y es un PDF
    if not os.path.exists(pdf_path):
        log_message(f"ERROR: El archivo {pdf_path} no existe.")
        sys.exit(1)
    
    if not pdf_path.lower().endswith('.pdf'):
        log_message(f"ERROR: El archivo debe ser un PDF. Archivo proporcionado: {pdf_path}")
        sys.exit(1)
    
    # Solicitar la API key
    
    # Extraer texto del PDF
    pages_text = extract_text_from_pdf(pdf_path)
    if not pages_text:
        log_message("ERROR: No se pudo extraer texto del PDF. Terminando ejecución.")
        return
        
    # Generar resumen
    summary = generate_summary(pages_text, api_key)
    if not summary:
        log_message("ERROR: No se pudo generar el resumen. Terminando ejecución.")
        return
        
    # Generar preguntas tipo test
    questions = generate_test_questions(pages_text, summary, api_key)
    
    # Preparar nombre del archivo de salida
    base_name = os.path.splitext(pdf_path)[0]
    output_file = f"{base_name}_test.json"
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(questions, f, ensure_ascii=False, indent=2)
        log_message(f"Flashcards guardadas exitosamente en: {output_file}")
        
        # Mostrar algunas flashcards de ejemplo
        log_message("\nEjemplos de flashcards generadas:")
        for i, flashcard in enumerate(questions[:2], 1):
            print(f"\nFlashcard {i}:")
            print(f"Pregunta: {flashcard['front']}")
            print(f"Respuesta correcta: {flashcard['back']}")
            print("Opciones incorrectas:")
            for wrong in flashcard['wrongOptions']:
                print(f"- {wrong}")
            print("-" * 40)
            
    except Exception as e:
        log_message(f"ERROR: Error al guardar las flashcards: {e}")

if __name__ == "__main__":
    main()