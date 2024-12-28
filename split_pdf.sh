#!/bin/bash

# Verificar si las herramientas necesarias están instaladas
if ! command -v pdfseparate &> /dev/null || ! command -v pdftk &> /dev/null; then
    echo "Error: Faltan herramientas necesarias."
    echo "Por favor, instala las siguientes herramientas:"
    echo "  Ubuntu/Debian: sudo apt-get install poppler-utils pdftk"
    echo "  MacOS: brew install poppler pdftk-java"
    exit 1
fi

# Verificar si se proporcionó un archivo
if [ $# -lt 1 ]; then
    echo "Uso: $0 <archivo.pdf>"
    exit 1
fi

INPUT_PDF="$1"

# Verificar si el archivo existe
if [ ! -f "$INPUT_PDF" ]; then
    echo "Error: El archivo $INPUT_PDF no existe"
    exit 1
fi

# Crear directorio para los PDFs separados
OUTPUT_DIR="pdfs_separados"
mkdir -p "$OUTPUT_DIR"

# Función para extraer rango de páginas
extract_pages() {
    local start=$1
    local end=$2
    local output=$3
    
    pdftk "$INPUT_PDF" cat $start-$end output "$output"
    if [ $? -eq 0 ]; then
        echo "✅ Creado: $output (páginas $start-$end)"
    else
        echo "❌ Error al crear $output"
    fi
}

echo "📚 Separador de PDFs"
echo "Archivo origen: $INPUT_PDF"
echo ""
echo "Ingresa los rangos de páginas para cada tema."
echo "Formato: inicio-fin nombre_archivo"
echo "Ejemplo: 1-15 tema1"
echo "(Escribe 'fin' cuando termines)"
echo ""

while true; do
    read -p "Rango y nombre (o 'fin' para terminar): " input
    
    if [ "$input" = "fin" ]; then
        break
    fi
    
    # Separar el input en rango y nombre
    range=$(echo $input | cut -d' ' -f1)
    name=$(echo $input | cut -d' ' -f2)
    
    # Extraer inicio y fin del rango
    start=$(echo $range | cut -d'-' -f1)
    end=$(echo $range | cut -d'-' -f2)
    
    # Verificar que los valores son números
    if [[ ! $start =~ ^[0-9]+$ ]] || [[ ! $end =~ ^[0-9]+$ ]]; then
        echo "❌ Error: El rango debe ser numérico (ejemplo: 1-15)"
        continue
    fi
    
    # Verificar que el nombre no está vacío
    if [ -z "$name" ]; then
        echo "❌ Error: Debes proporcionar un nombre para el archivo"
        continue
    fi
    
    output_file="$OUTPUT_DIR/${name}.pdf"
    extract_pages $start $end "$output_file"
done

echo ""
echo "✨ Proceso completado. Los archivos están en el directorio '$OUTPUT_DIR'" 