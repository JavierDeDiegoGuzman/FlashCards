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
   pip install PyPDF2 openai python-dotenv

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
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List

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
    print("   pip install PyPDF2 openai python-dotenv")
    sys.exit(1)

def log_message(message):
    """Función para imprimir mensajes de debug con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    print(f"[{timestamp}] {message}")

def extract_text_from_pdf(pdf_path):
    """Extrae texto de un archivo PDF y lo devuelve como una cadena única."""
    log_message(f"Iniciando extracción de texto del archivo: {pdf_path}")
    full_text = ""
    try:
        with open(pdf_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            total_pages = len(pdf_reader.pages)
            log_message(f"Total de páginas encontradas: {total_pages}")
            
            for page_num in range(total_pages):
                log_message(f"Procesando página {page_num + 1}/{total_pages}")
                page = pdf_reader.pages[page_num]
                text = page.extract_text()
                if text.strip():
                    full_text += text + " "
                
    except FileNotFoundError:
        log_message(f"ERROR: Archivo no encontrado en {pdf_path}")
        return None
    except Exception as e:
        log_message(f"ERROR: Error al procesar el PDF: {e}")
        return None

    log_message(f"Texto extraído exitosamente de {pdf_path}")
    return full_text.strip()

def split_text_into_chunks(text, max_tokens=2000, overlap_tokens=200):
    """Divide el texto en chunks con overlap basados en tokens aproximados."""
    words = text.split()
    chunks = []
    current_position = 0
    
    # Estimación: 1 palabra ≈ 1.3 tokens
    words_per_chunk = int(max_tokens / 1.3)
    overlap_words = int(overlap_tokens / 1.3)
    
    while current_position < len(words):
        # Tomar palabras para el chunk actual
        end_position = min(current_position + words_per_chunk, len(words))
        chunk = ' '.join(words[current_position:end_position])
        chunks.append(chunk)
        
        # Mover la posición, restando el overlap
        current_position += words_per_chunk - overlap_words
    
    return chunks

class Flashcard(BaseModel):
    front: str
    back: str
    wrongOptions: List[str]

class FlashcardList(BaseModel):
    flashcards: List[Flashcard]

def generate_test_questions(text, api_key, max_tokens=2000):
    """Genera preguntas tipo test a partir del texto, manteniendo contexto entre chunks."""
    
    client = OpenAI(api_key=api_key)
    all_flashcards = []
    
    if not text:
        log_message("ERROR: No hay texto para procesar")
        return all_flashcards

    # Dividir el texto en chunks con overlap
    text_chunks = split_text_into_chunks(text, max_tokens)
    total_chunks = len(text_chunks)
    log_message(f"Texto dividido en {total_chunks} chunks")
    
    system_prompt = """Eres un profesor experto que debe crear preguntas tipo test. 
    Tu objetivo es crear una cobertura COMPLETA y EXHAUSTIVA del material proporcionado.
    Genera preguntas que cumplan EXACTAMENTE el formato especificado.
    
    IMPORTANTE:
    - Crea preguntas para CADA concepto, definición, proceso o idea importante en el texto
    - Asegúrate de no dejar ningún contenido relevante sin cubrir
    - Cada pregunta debe ser clara y específica
    - La respuesta correcta debe ser inequívoca
    - SIEMPRE incluye exactamente DOS opciones incorrectas
    - Las opciones incorrectas deben ser plausibles pero claramente incorrectas
    - No repitas preguntas similares
    - Si hay listas o enumeraciones en el texto, crea preguntas específicas para cada elemento
    - Para procesos o procedimientos, crea preguntas sobre cada paso importante
    - Incluye preguntas tanto sobre conceptos generales como sobre detalles específicos"""
    
    for i, chunk in enumerate(text_chunks):
        log_message(f"\n--- Procesando chunk {i + 1}/{total_chunks} ---")
        
        try:
            completion = client.beta.chat.completions.parse(
                model="gpt-4o-mini",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Analiza este texto y genera preguntas tipo test que cubran EXHAUSTIVAMENTE todo el contenido relevante. No omitas ningún concepto o detalle importante:\n\n{chunk}"}
                ],
                response_format=FlashcardList,
                temperature=0.3,
                max_tokens=4000
            )
            
            batch_flashcards = completion.choices[0].message.parsed.flashcards
            all_flashcards.extend(batch_flashcards)
            
            log_message(f"Flashcards válidas en este chunk: {len(batch_flashcards)}")
            
        except Exception as e:
            log_message(f"Error al procesar chunk {i + 1}: {str(e)}")
            continue

    log_message(f"\nTotal de flashcards generadas: {len(all_flashcards)}")
    return all_flashcards

def main():
    # Cargar variables de entorno
    load_dotenv()
    api_key = os.getenv('OPENAI_API_KEY')
    
    if not api_key:
        log_message("ERROR: No se encontró OPENAI_API_KEY en el archivo .env")
        sys.exit(1)

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
    
    # Extraer texto del PDF
    text = extract_text_from_pdf(pdf_path)
    if not text:
        log_message("ERROR: No se pudo extraer texto del PDF. Terminando ejecución.")
        return
        
    # Generar preguntas tipo test
    questions = generate_test_questions(text, api_key)
    
    # Preparar nombre del archivo de salida
    base_name = os.path.splitext(pdf_path)[0]
    output_file = f"{base_name}_test.json"
    
    try:
        # Convertir los objetos Flashcard a diccionarios antes de guardar
        flashcards_dict = [flashcard.model_dump() for flashcard in questions]
        
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(flashcards_dict, f, ensure_ascii=False, indent=2)
        log_message(f"Flashcards guardadas exitosamente en: {output_file}")
        
        # Mostrar algunas flashcards de ejemplo
        log_message("\nEjemplos de flashcards generadas:")
        for i, flashcard in enumerate(questions[:2], 1):
            print(f"\nFlashcard {i}:")
            print(f"Pregunta: {flashcard.front}")
            print(f"Respuesta correcta: {flashcard.back}")
            print("Opciones incorrectas:")
            for wrong in flashcard.wrongOptions:
                print(f"- {wrong}")
            print("-" * 40)
            
    except Exception as e:
        log_message(f"ERROR: Error al guardar las flashcards: {e}")

if __name__ == "__main__":
    main()
