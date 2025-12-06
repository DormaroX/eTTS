#!/usr/bin/env python3
import os
import argparse
from pathlib import Path

def merge_files(input_files, output_file):
    """
    Merge multiple text files into one while preserving the input files.
    
    Args:
        input_files (list): List of input file paths
        output_file (str): Path to the output file
    """
    with open(output_file, 'w', encoding='utf-8') as outfile:
        for fname in input_files:
            if os.path.exists(fname):
                with open(fname, 'r', encoding='utf-8') as infile:
                    outfile.write(infile.read())
                    # Add a newline between files if needed
                    outfile.write('\n')
            else:
                print(f"Warnung: Datei {fname} nicht gefunden")

def main():
    parser = argparse.ArgumentParser(description='Mehrere Textdateien zusammenführen')
    parser.add_argument('files', nargs='+', help='Eingabedateien in gewünschter Reihenfolge')
    parser.add_argument('-o', '--output', default='combined_output.txt',
                        help='Ausgabedatei (Standard: combined_output.txt)')
    
    args = parser.parse_args()
    
    # Absolute Pfade erstellen
    input_files = [str(Path(f).absolute()) for f in args.files]
    output_file = str(Path(args.output).absolute())
    
    print(f"Führe folgende Dateien zusammen:")
    for f in input_files:
        print(f"- {f}")
    print(f"Ausgabedatei: {output_file}")
    
    merge_files(input_files, output_file)
    print("Zusammenführung abgeschlossen!")

if __name__ == '__main__':
    main()
