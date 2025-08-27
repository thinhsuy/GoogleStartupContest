import logging
import os
import sys
from logging import config
from pathlib import Path
from dotenv import load_dotenv
from rich.logging import RichHandler
import time
import functools

load_dotenv()

BASE_DIR = Path(__file__).parent.parent.absolute()
LOGS_DIR = Path(BASE_DIR, "logs")
LOGS_DIR.mkdir(parents=True, exist_ok=True)
PACKAGE_DIR = Path(BASE_DIR, "core")
STORE_DIR = Path(PACKAGE_DIR, "store")

logging_config = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "minimal": {"format": "%(message)s"},
        "detailed": {
            "format": "%(levelname)s %(asctime)s [%(name)s:%(filename)s:\
                %(funcName)s:%(lineno)d]\n%(message)s\n"
        },
    },
    "handlers": {
        "console": {
            "class": "logging.StreamHandler",
            "stream": sys.stdout,
            "formatter": "minimal",
            "level": logging.DEBUG,
        },
        "info": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": Path(LOGS_DIR, "info.log"),
            "maxBytes": 10485760,  # 1 MB
            "backupCount": 10,
            "formatter": "detailed",
            "level": logging.INFO,
        },
        "error": {
            "class": "logging.handlers.RotatingFileHandler",
            "filename": Path(LOGS_DIR, "error.log"),
            "maxBytes": 10485760,  # 1 MB
            "backupCount": 10,
            "formatter": "detailed",
            "level": logging.ERROR,
        },
    },
    "root": {
        "handlers": ["console", "info", "error"],
        "level": logging.INFO,
        "propagate": True,
    },
}

config.dictConfig(logging_config)
logger = logging.getLogger("Core")
logger.setLevel(logging.DEBUG)

if len(logger.handlers):
    logger.handlers[0] = RichHandler(markup=True)
else:
    logger.handlers.append(RichHandler(markup=True))


def async_timeit():
    def decorator(func):
        @functools.wraps(func)
        async def timeit(*args, **kwargs):
            ts = time.perf_counter()
            result = await func(*args, **kwargs)
            te = time.perf_counter()
            logger.debug(
                "[{} - {}()] took {:.4f} sec.".format(
                    os.path.basename(func.__code__.co_filename),
                    func.__qualname__,
                    te - ts,
                )
            )
            return result

        return timeit

    return decorator
