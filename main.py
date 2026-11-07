import webview
import os
import sys

def main():
    # PyInstaller creates a temp folder and stores path in _MEIPASS
    if hasattr(sys, '_MEIPASS'):
        base_path = sys._MEIPASS
    else:
        base_path = os.path.dirname(os.path.abspath(__file__))
        
    html_path = os.path.join(base_path, 'index.html')
    url = 'file://' + html_path.replace('\\', '/')
    
    # Create the app window
    webview.create_window(
        title='My Personal Calendar', 
        url=url, 
        width=1200, 
        height=800,
        min_size=(800, 600)
    )
    
    webview.start()

if __name__ == '__main__':
    main()
