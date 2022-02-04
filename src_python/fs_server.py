# https://github.com/ChrisKnott/Eel/tree/master/examples/07%20-%20CreateReactApp

import eel

@eel.expose
def py_write_graph_file(contents: str):
    with open('graph.json', 'w+') as f:
        f.write(contents)

@eel.expose
def py_read_graph_file() -> str:
    try:
        with open('graph.json', 'r') as f:
            return f.read()
    except Exception:
        return ''

import time
@eel.expose
def py_bomb():
    print(f"Bomb!!! {time.time()}")

def start_eel(develop):
    """Start Eel with either production or development configuration."""

    if develop:
        directory = '../src'
        app = None
        page = {'port': 3000}
    else:
        directory = '../build'
        app = 'chrome-app'
        page = 'index.html'

    eel.init(directory, ['.tsx', '.ts', '.jsx', '.js', '.html'])

    eel_kwargs = dict(
        host='localhost',
        port=8080,
        size=(1280, 800),
    )
    try:
        eel.start(page, mode=app, shutdown_delay=1000*1000, **eel_kwargs)
    except EnvironmentError:
        # If Chrome isn't found, fallback to Microsoft Edge on Win10 or greater
        if sys.platform in ['win32', 'win64'] and int(platform.release()) >= 10:
            eel.start(page, mode='edge', **eel_kwargs)
        else:
            raise


if __name__ == '__main__':
    import sys

    # Pass any second argument to enable debugging
    start_eel(develop=('--devel' in sys.argv))
