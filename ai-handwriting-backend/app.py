from flask import Flask, request, jsonify, session
from flask_cors import CORS

import os
import base64
import io
import pickle
import shutil
import tempfile
import traceback
import sqlite3
import json
from datetime import datetime, timedelta
import hashlib
import hmac
import secrets

import numpy as np
from PIL import Image, ImageOps

import tensorflow as tf


# ============================================================
# SCRIPTLY FLASK APPLICATION
# ============================================================

app = Flask(__name__)
app.secret_key = os.environ.get("SCRIPTLY_SECRET_KEY", "scriptly-development-secret-change-me")

# Required when the Vercel frontend and Render backend are on different origins.
app.config.update(
    SESSION_COOKIE_SAMESITE="None",
    SESSION_COOKIE_SECURE=True,
    SESSION_COOKIE_HTTPONLY=True,
)

CORS(
    app,
    resources={
        r"/*": {
            "origins": [
                "http://localhost:5173",
                "http://127.0.0.1:5173",
                "https://scripty-beryl.vercel.app",
            ],
            "supports_credentials": True,
            "allow_headers": [
                "Content-Type",
                "Authorization",
            ],
            "methods": [
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS",
            ],
        }
    },
)


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

MODELS_DIR = os.path.join(
    BASE_DIR,
    "models"
)


# ============================================================
# LANGUAGE ALIASES
# ============================================================

LANGUAGE_ALIASES = {
    "English": "English",

    "Hindi": "Hindi",
    "हिंदी": "Hindi",

    "Japanese": "Japanese",
    "日本語": "Japanese",

    "Korean": "Korean",
    "한국어": "Korean",

    "Russian": "Russian",
    "Русский": "Russian",
}


# ============================================================
# LANGUAGE CONFIGURATION
#
# IMPORTANT:
# Use ONLY the models from:
# ai-handwriting-backend/models/
# ============================================================

LANGUAGE_CONFIG = {

    # --------------------------------------------------------
    # ENGLISH
    # --------------------------------------------------------

    "English": {
        "model_file": "english_model.keras",
        "encoder_file": "english_label_encoder.pkl",
        "input_size": 64,
        "invert": True,
    },

    # --------------------------------------------------------
    # HINDI
    # --------------------------------------------------------

    "Hindi": {
        "model_file": "hindi_consonant_model.keras",
        "encoder_file": "hindi_label_encoder.pkl",
        "input_size": 64,
        "invert": False,
    },

    # --------------------------------------------------------
    # JAPANESE
    # --------------------------------------------------------

    "Japanese": {
        "model_file": "japanese_model.keras",
        "encoder_file": "japanese_label_encoder.pkl",
        "input_size": 28,
        "invert": True,
    },

    # --------------------------------------------------------
    # KOREAN
    # --------------------------------------------------------

    "Korean": {
    "model_file": "korean_model.keras",
    "encoder_file": "korean_label_encoder.pkl",
    "input_size": 64,
    "invert": False,
    },

    # --------------------------------------------------------
    # RUSSIAN
    # --------------------------------------------------------

    "Russian": {
        "model_file": "russian_model.keras",
        "encoder_file": "russian_label_encoder.pkl",
        "input_size": 64,
        "invert": False,
    },
}


# ============================================================
# ENGLISH CHARACTERS
# ============================================================

ENGLISH_CHARS = [
    chr(c)
    for c in range(
        ord("A"),
        ord("Z") + 1
    )
]


# ============================================================
# HINDI CHARACTER MAP
#
# Model class number -> Hindi character
# ============================================================

HINDI_CONSONANT_MAP = {

    1: ("क", "ka"),
    2: ("ख", "kha"),
    3: ("ग", "ga"),
    4: ("घ", "gha"),
    5: ("ङ", "nga"),

    6: ("च", "cha"),
    7: ("छ", "chha"),
    8: ("ज", "ja"),
    9: ("झ", "jha"),
    10: ("ञ", "nya"),

    11: ("ट", "Ta"),
    12: ("ठ", "Tha"),
    13: ("ड", "Da"),
    14: ("ढ", "Dha"),
    15: ("ण", "Na"),

    16: ("त", "ta"),
    17: ("थ", "tha"),
    18: ("द", "da"),
    19: ("ध", "dha"),
    20: ("न", "na"),

    21: ("प", "pa"),
    22: ("फ", "pha"),
    23: ("ब", "ba"),
    24: ("भ", "bha"),
    25: ("म", "ma"),

    26: ("य", "ya"),
    27: ("र", "ra"),
    28: ("ल", "la"),
    29: ("व", "va"),
    30: ("श", "sha"),

    31: ("ष", "Sha"),
    32: ("स", "sa"),
    33: ("ह", "ha"),

    34: ("क्ष", "ksha"),
    35: ("त्र", "tra"),
    36: ("ज्ञ", "gya"),
}


# ============================================================
# HINDI FRONTEND LABEL -> GLYPH
# ============================================================

HINDI_LABEL_TO_GLYPH = {

    "ka": "क",
    "kha": "ख",
    "ga": "ग",
    "gha": "घ",

    "kna": "ङ",
    "nga": "ङ",

    "cha": "च",
    "chha": "छ",

    "ja": "ज",
    "jha": "झ",

    "yna": "ञ",
    "nya": "ञ",

    "taamatar": "ट",
    "Ta": "ट",

    "thaa": "ठ",
    "Tha": "ठ",

    "daa": "ड",
    "Da": "ड",

    "dhaa": "ढ",
    "Dha": "ढ",

    "adna": "ण",
    "Na": "ण",

    "ta": "त",
    "tha": "थ",
    "da": "द",
    "dha": "ध",
    "na": "न",

    "pa": "प",
    "pha": "फ",
    "ba": "ब",
    "bha": "भ",
    "ma": "म",

    "yaw": "य",
    "ya": "य",

    "ra": "र",
    "la": "ल",

    "waw": "व",
    "va": "व",

    "motosaw": "श",
    "sha": "श",

    "patalosaw": "ष",
    "Sha": "ष",

    "tabala": "स",
    "sa": "स",

    "ha": "ह",

    "petchiryakha": "क्ष",
    "ksha": "क्ष",

    "tra": "त्र",
    "gya": "ज्ञ",

    "chhya": "श्र",
}


# ============================================================
# JAPANESE KUZUSHIJI-49 MAP
#
# Model class index -> Hiragana
# ============================================================

JAPANESE_K49_MAP = {

    0: ("あ", "a"),
    1: ("い", "i"),
    2: ("う", "u"),
    3: ("え", "e"),
    4: ("お", "o"),

    5: ("か", "ka"),
    6: ("き", "ki"),
    7: ("く", "ku"),
    8: ("け", "ke"),
    9: ("こ", "ko"),

    10: ("さ", "sa"),
    11: ("し", "shi"),
    12: ("す", "su"),
    13: ("せ", "se"),
    14: ("そ", "so"),

    15: ("た", "ta"),
    16: ("ち", "chi"),
    17: ("つ", "tsu"),
    18: ("て", "te"),
    19: ("と", "to"),

    20: ("な", "na"),
    21: ("に", "ni"),
    22: ("ぬ", "nu"),
    23: ("ね", "ne"),
    24: ("の", "no"),

    25: ("は", "ha"),
    26: ("ひ", "hi"),
    27: ("ふ", "fu"),
    28: ("へ", "he"),
    29: ("ほ", "ho"),

    30: ("ま", "ma"),
    31: ("み", "mi"),
    32: ("む", "mu"),
    33: ("め", "me"),
    34: ("も", "mo"),

    35: ("や", "ya"),
    36: ("ゆ", "yu"),
    37: ("よ", "yo"),

    38: ("ら", "ra"),
    39: ("り", "ri"),
    40: ("る", "ru"),
    41: ("れ", "re"),
    42: ("ろ", "ro"),

    43: ("わ", "wa"),
    44: ("ゐ", "wi"),
    45: ("ゑ", "we"),
    46: ("を", "wo"),
    47: ("ん", "n"),
    48: ("ゝ", "iteration mark"),
}


# ============================================================
# MODEL STORAGE
# ============================================================

models = {}
encoders = {}


# ============================================================
# FIND FILE
# ============================================================

def find_file(language, filename):

    language_dir = os.path.join(
        MODELS_DIR,
        language
    )

    direct_path = os.path.join(
        language_dir,
        filename
    )

    if os.path.exists(direct_path):
        return direct_path

    return None


# ============================================================
# LOAD KERAS MODEL
#
# Some .keras files are internally HDF5.
# We support both normal Keras and HDF5 loading.
# ============================================================

def load_keras_model(path):

    try:

        print(
            f"[INFO] Loading Keras model:"
            f" {path}"
        )

        model = tf.keras.models.load_model(
            path,
            compile=False
        )

        return model

    except Exception as first_error:

        print(
            "[WARNING] Normal Keras loading failed."
        )

        print(first_error)

        try:

            import h5py

            if h5py.is_hdf5(path):

                print(
                    "[INFO] File detected as HDF5."
                )

                temp_dir = tempfile.mkdtemp()

                h5_path = os.path.join(
                    temp_dir,
                    "model.h5"
                )

                shutil.copyfile(
                    path,
                    h5_path
                )

                model = tf.keras.models.load_model(
                    h5_path,
                    compile=False
                )

                return model

        except Exception as second_error:

            print(
                "[ERROR] HDF5 loading failed:"
            )

            print(second_error)

        raise first_error


# ============================================================
# LOAD PICKLE ENCODER
# ============================================================

def load_encoder(path):

    with open(
        path,
        "rb"
    ) as file:

        return pickle.load(file)


# ============================================================
# GET ENCODER CLASSES
# ============================================================

def get_encoder_classes(encoder):

    if hasattr(
        encoder,
        "classes_"
    ):

        return list(
            encoder.classes_
        )

    try:

        return list(
            encoder
        )

    except Exception:

        return []


# ============================================================
# LOAD ALL MODELS
# ============================================================

def load_models():

    print()
    print("=" * 70)
    print(
        "SCRIPTLY AI HANDWRITING MODEL LOADING"
    )
    print("=" * 70)

    models.clear()
    encoders.clear()

    for language, config in LANGUAGE_CONFIG.items():

        print()
        print(
            f"[LOADING] {language}"
        )

        # ----------------------------------------------------
        # MODEL
        # ----------------------------------------------------

        model_filename = config[
            "model_file"
        ]

        model_path = find_file(
            language,
            model_filename
        )

        if not model_path:

            print(
                f"[ERROR] Model not found:"
                f" models/{language}/{model_filename}"
            )

            continue

        print(
            f"[PATH] {model_path}"
        )

        try:

            model = load_keras_model(
                model_path
            )

            # ------------------------------------------------
            # ENCODER
            # ------------------------------------------------

            encoder_filename = config[
                "encoder_file"
            ]

            encoder_path = find_file(
                language,
                encoder_filename
            )

            if not encoder_path:

                print(
                    f"[ERROR] Encoder not found:"
                    f" models/{language}/{encoder_filename}"
                )

                continue

            encoder = load_encoder(
                encoder_path
            )

            raw_classes = get_encoder_classes(
                encoder
            )

            if not raw_classes:

                print(
                    f"[ERROR] Encoder contains"
                    f" no classes for {language}"
                )

                continue

            # ------------------------------------------------
            # MODEL CLASS COUNT
            # ------------------------------------------------

            try:

                model_classes = int(
                    model.output_shape[-1]
                )

                encoder_classes = len(
                    raw_classes
                )

                print(
                    f"[INFO] Model classes:"
                    f" {model_classes}"
                )

                print(
                    f"[INFO] Encoder classes:"
                    f" {encoder_classes}"
                )

                if model_classes != encoder_classes:

                    print(
                        f"[ERROR] CLASS COUNT MISMATCH"
                        f" for {language}"
                    )

                    print(
                        f"        Model: {model_classes}"
                    )

                    print(
                        f"        Encoder:"
                        f" {encoder_classes}"
                    )

                    continue

                print(
                    f"[OK] Class count verified:"
                    f" {model_classes}"
                )

            except Exception as error:

                print(
                    f"[WARNING] Could not verify"
                    f" class count: {error}"
                )

            # ------------------------------------------------
            # STORE
            # ------------------------------------------------

            models[
                language
            ] = model

            encoders[
                language
            ] = encoder

            # ------------------------------------------------
            # MODEL INFORMATION
            # ------------------------------------------------

            print(
                f"[INFO] Input shape:"
                f" {model.input_shape}"
            )

            print(
                f"[INFO] Output shape:"
                f" {model.output_shape}"
            )

            print(
                f"[OK] {language} model loaded"
            )

        except Exception as error:

            print()
            print(
                f"[ERROR] Failed loading"
                f" {language} model:"
            )

            print(error)

            traceback.print_exc()

    print()
    print("=" * 70)
    print(
        "MODEL LOADING COMPLETE"
    )
    print("=" * 70)

    print()

    print(
        "[READY] Loaded languages:"
    )

    for language in LANGUAGE_CONFIG:

        if language in models:

            print(
                f"  ✓ {language}"
            )

        else:

            print(
                f"  ✗ {language}"
            )

    print()


# ============================================================
# IMPORTANT
#
# LOAD MODELS BEFORE FLASK STARTS
# ============================================================

load_models()


# ============================================================
# DECODE MODEL PREDICTION
# ============================================================

def decode_prediction(
    language,
    class_index
):

    class_index = int(
        class_index
    )

    # ========================================================
    # ENGLISH
    # ========================================================

    if language == "English":

        encoder = encoders.get(
            "English"
        )

        if encoder is None:

            return "?"

        raw_classes = get_encoder_classes(
            encoder
        )

        if class_index < len(
            raw_classes
        ):

            return str(
                raw_classes[class_index]
            )

        if class_index < len(
            ENGLISH_CHARS
        ):

            return ENGLISH_CHARS[
                class_index
            ]

        return "?"

    # ========================================================
    # HINDI
    # ========================================================

    if language == "Hindi":

        encoder = encoders.get(
            "Hindi"
        )

        if encoder is None:

            return "?"

        raw_classes = get_encoder_classes(
            encoder
        )

        if class_index >= len(
            raw_classes
        ):

            return "?"

        raw = raw_classes[
            class_index
        ]

        # ----------------------------------------------------
        # Numeric Hindi encoder
        # ----------------------------------------------------

        try:

            number = int(
                raw
            )

            mapped = HINDI_CONSONANT_MAP.get(
                number
            )

            if mapped:

                return mapped[0]

            return f"#{number}"

        except Exception:

            pass

        # ----------------------------------------------------
        # String Hindi label
        # ----------------------------------------------------

        raw_string = str(
            raw
        )

        if raw_string in HINDI_LABEL_TO_GLYPH:

            return HINDI_LABEL_TO_GLYPH[
                raw_string
            ]

        return raw_string

    # ========================================================
    # JAPANESE
    # ========================================================

    if language == "Japanese":

        mapped = JAPANESE_K49_MAP.get(
            class_index
        )

        if mapped:

            return mapped[0]

        return f"#{class_index}"

    # ========================================================
    # KOREAN / RUSSIAN
    #
    # Current encoder labels are returned directly.
    # ========================================================

    encoder = encoders.get(
        language
    )

    if encoder is None:

        return "?"

    raw_classes = get_encoder_classes(
        encoder
    )

    if class_index < len(
        raw_classes
    ):

        return str(
            raw_classes[class_index]
        )

    return "?"


# ============================================================
# NORMALIZE TARGET
# ============================================================

def normalize_target_character(
    language,
    target
):

    if target is None:

        return ""

    target = str(
        target
    ).strip()

    # ========================================================
    # HINDI
    # ========================================================

    if language == "Hindi":

        # Already Hindi character
        if target in HINDI_LABEL_TO_GLYPH.values():

            return target

        # Frontend label
        mapped = HINDI_LABEL_TO_GLYPH.get(
            target
        )

        if mapped:

            return mapped

        # Numeric class
        try:

            number = int(
                target
            )

            mapped = HINDI_CONSONANT_MAP.get(
                number
            )

            if mapped:

                return mapped[0]

        except Exception:

            pass

    # ========================================================
    # JAPANESE
    # ========================================================

    if language == "Japanese":

        # Already Hiragana
        if target in [
            value[0]
            for value in JAPANESE_K49_MAP.values()
        ]:

            return target

        # Numeric class
        try:

            number = int(
                target
            )

            mapped = JAPANESE_K49_MAP.get(
                number
            )

            if mapped:

                return mapped[0]

        except Exception:

            pass

    return target


# ============================================================
# NORMALIZE RECOGNIZED
# ============================================================

def normalize_recognized_character(
    language,
    recognized
):

    if recognized is None:

        return ""

    recognized = str(
        recognized
    ).strip()

    if language == "Hindi":

        if recognized in HINDI_LABEL_TO_GLYPH:

            return HINDI_LABEL_TO_GLYPH[
                recognized
            ]

    return recognized


# ============================================================
# GET PRACTICE CHARACTERS
# ============================================================

def get_practice_characters(
    language
):

    # ========================================================
    # ENGLISH
    # ========================================================

    if language == "English":

        encoder = encoders.get(
            "English"
        )

        if encoder is None:

            return ENGLISH_CHARS

        return [
            str(x)
            for x in get_encoder_classes(
                encoder
            )
        ]

    # ========================================================
    # HINDI
    # ========================================================

    if language == "Hindi":

        encoder = encoders.get(
            "Hindi"
        )

        if encoder is None:

            return [
                value[0]
                for value in
                HINDI_CONSONANT_MAP.values()
            ]

        result = []

        for raw in get_encoder_classes(
            encoder
        ):

            try:

                number = int(
                    raw
                )

                mapped = HINDI_CONSONANT_MAP.get(
                    number
                )

                if mapped:

                    result.append(
                        mapped[0]
                    )

                else:

                    result.append(
                        f"#{number}"
                    )

            except Exception:

                raw_string = str(
                    raw
                )

                if raw_string in HINDI_LABEL_TO_GLYPH:

                    result.append(
                        HINDI_LABEL_TO_GLYPH[
                            raw_string
                        ]
                    )

                else:

                    result.append(
                        raw_string
                    )

        return result

    # ========================================================
    # JAPANESE
    # ========================================================

    if language == "Japanese":

        encoder = encoders.get(
            "Japanese"
        )

        if encoder is None:

            return [
                value[0]
                for value in
                JAPANESE_K49_MAP.values()
            ]

        result = []

        for raw in get_encoder_classes(
            encoder
        ):

            try:

                index = int(
                    raw
                )

                mapped = JAPANESE_K49_MAP.get(
                    index
                )

                if mapped:

                    result.append(
                        mapped[0]
                    )

                else:

                    result.append(
                        f"#{index}"
                    )

            except Exception:

                result.append(
                    str(raw)
                )

        return result

    # ========================================================
    # KOREAN / RUSSIAN
    # ========================================================

    encoder = encoders.get(
        language
    )

    if encoder is None:

        return []

    return [
        str(x)
        for x in get_encoder_classes(
            encoder
        )
    ]


# ============================================================
# IMAGE PREPROCESSING
# ============================================================

INK_FIT_RATIO = 0.92


def preprocess_image(
    image_data,
    img_size,
    invert=True
):

    # --------------------------------------------------------
    # REMOVE DATA URL PREFIX
    # --------------------------------------------------------

    if "," in image_data:

        image_data = image_data.split(
            ",",
            1
        )[1]

    # --------------------------------------------------------
    # BASE64
    # --------------------------------------------------------

    try:

        image_bytes = base64.b64decode(
            image_data
        )

    except Exception:

        raise ValueError(
            "Invalid handwriting image data."
        )

    # --------------------------------------------------------
    # OPEN IMAGE
    # --------------------------------------------------------

    try:

        image = Image.open(
            io.BytesIO(image_bytes)
        )

    except Exception:

        raise ValueError(
            "Unable to read handwriting image."
        )

    # --------------------------------------------------------
    # RGBA
    # --------------------------------------------------------

    image = image.convert(
        "RGBA"
    )

    rgba = np.array(
        image
    ).astype(
        np.uint8
    )

    red = rgba[:, :, 0].astype(
        np.int16
    )

    green = rgba[:, :, 1].astype(
        np.int16
    )

    blue = rgba[:, :, 2].astype(
        np.int16
    )

    alpha = rgba[:, :, 3]

    # ========================================================
    # ALPHA MASK
    #
    # React canvas handwriting may be transparent.
    # ========================================================

    alpha_mask = (
        alpha > 20
    )

    # ========================================================
    # COLOR DETECTION
    #
    # Supports purple/colored handwriting.
    # ========================================================

    max_channel = np.maximum(
        np.maximum(
            red,
            green
        ),
        blue
    )

    min_channel = np.minimum(
        np.minimum(
            red,
            green
        ),
        blue
    )

    saturation_difference = (
        max_channel -
        min_channel
    )

    colored_ink = (
        saturation_difference > 25
    )

    bright_colored_ink = (
        max_channel > 150
    ) & (
        saturation_difference > 15
    )

    colored_mask = (
        colored_ink |
        bright_colored_ink
    ) & alpha_mask

    # ========================================================
    # NORMAL BLACK/DARK HANDWRITING
    # ========================================================

    background = np.full(
        (
            rgba.shape[0],
            rgba.shape[1],
            3
        ),
        255,
        dtype=np.uint8
    )

    alpha_float = (
        rgba[:, :, 3:4].astype(
            np.float32
        ) / 255.0
    )

    rgb_float = (
        rgba[:, :, :3].astype(
            np.float32
        )
    )

    composited_rgb = (
        rgb_float *
        alpha_float
        +
        background *
        (
            1 -
            alpha_float
        )
    )

    gray = (
        0.299 *
        composited_rgb[:, :, 0]
        +
        0.587 *
        composited_rgb[:, :, 1]
        +
        0.114 *
        composited_rgb[:, :, 2]
    )

    dark_mask = (
        gray < 220
    )

    # ========================================================
    # CHOOSE MASK
    # ========================================================

    if np.any(
        colored_mask
    ):

        ink_mask = colored_mask

    else:

        ink_mask = dark_mask

    # ========================================================
    # NO HANDWRITING
    # ========================================================

    if not np.any(
        ink_mask
    ):

        raise ValueError(
            "No handwriting detected. "
            "Please draw a character."
        )

    # ========================================================
    # CLEAN IMAGE
    #
    # White background
    # Black handwriting
    # ========================================================

    clean_array = np.full(
        (
            rgba.shape[0],
            rgba.shape[1]
        ),
        255,
        dtype=np.uint8
    )

    clean_array[
        ink_mask
    ] = 0

    cleaned = Image.fromarray(
        clean_array,
        mode="L"
    )

    # ========================================================
    # BOUNDING BOX
    # ========================================================

    ys, xs = np.where(
        ink_mask
    )

    x0 = int(
        xs.min()
    )

    x1 = int(
        xs.max()
    )

    y0 = int(
        ys.min()
    )

    y1 = int(
        ys.max()
    )

    # ========================================================
    # PADDING
    # ========================================================

    pad = max(
        2,
        int(
            0.05 *
            max(
                x1 - x0,
                y1 - y0,
                1
            )
        )
    )

    x0 = max(
        x0 - pad,
        0
    )

    y0 = max(
        y0 - pad,
        0
    )

    x1 = min(
        x1 + pad,
        clean_array.shape[1] - 1
    )

    y1 = min(
        y1 + pad,
        clean_array.shape[0] - 1
    )

    # ========================================================
    # CROP
    # ========================================================

    cropped = cleaned.crop(
        (
            x0,
            y0,
            x1 + 1,
            y1 + 1
        )
    )

    # ========================================================
    # RESIZE
    # ========================================================

    target_span = max(
        1,
        int(
            img_size *
            INK_FIT_RATIO
        )
    )

    width, height = cropped.size

    scale = (
        target_span /
        float(
            max(
                width,
                height
            )
        )
    )

    new_width = max(
        1,
        round(
            width *
            scale
        )
    )

    new_height = max(
        1,
        round(
            height *
            scale
        )
    )

    cropped_resized = cropped.resize(
        (
            new_width,
            new_height
        ),
        Image.Resampling.LANCZOS
    )

    # ========================================================
    # CENTER
    # ========================================================

    canvas = Image.new(
        "L",
        (
            img_size,
            img_size
        ),
        255
    )

    offset_x = (
        img_size -
        new_width
    ) // 2

    offset_y = (
        img_size -
        new_height
    ) // 2

    canvas.paste(
        cropped_resized,
        (
            offset_x,
            offset_y
        )
    )

    # ========================================================
    # INVERT
    # ========================================================

    if invert:

        canvas = ImageOps.invert(
            canvas
        )

    # ========================================================
    # NORMALIZE
    # ========================================================

    processed = np.array(
        canvas
    ).astype(
        np.float32
    ) / 255.0

    processed = processed.reshape(
        1,
        img_size,
        img_size,
        1
    )

    # ========================================================
    # DEBUG IMAGE
    # ========================================================

    debug_name = (
        f"debug_model_input_"
        f"{img_size}_"
        f"{'inverted' if invert else 'normal'}"
        ".png"
    )

    debug_path = os.path.join(
        BASE_DIR,
        debug_name
    )

    debug_image = (
        processed[
            0,
            :,
            :,
            0
        ] *
        255
    ).astype(
        np.uint8
    )

    Image.fromarray(
        debug_image
    ).save(
        debug_path
    )

    print()
    print(
        "[DEBUG] Model input saved:"
    )

    print(
        debug_path
    )

    print(
        "[DEBUG] Input shape:",
        processed.shape
    )

    print(
        "[DEBUG] Ink pixels:",
        int(
            np.sum(
                ink_mask
            )
        )
    )

    print(
        "[DEBUG] Bounding box:",
        (
            x0,
            y0,
            x1,
            y1
        )
    )

    return processed


# ============================================================
# FEEDBACK
# ============================================================

def generate_feedback(
    recognized,
    target,
    confidence,
    is_correct
):

    if is_correct:

        if confidence >= 90:

            return (
                f"Excellent! Your "
                f"{target} was recognized "
                f"with very high confidence. "
                f"Keep practicing to maintain "
                f"your accuracy."
            )

        if confidence >= 70:

            return (
                f"Good job! Your "
                f"{target} was recognized "
                f"correctly. Try making the "
                f"character more consistent "
                f"for an even higher score."
            )

        return (
            f"Your character was recognized "
            f"correctly, but the confidence "
            f"is relatively low. Try writing "
            f"the character more clearly."
        )

    return (
        f"The AI recognized your handwriting "
        f"as {recognized} instead of {target}. "
        f"Try matching the target character's "
        f"overall shape more closely and "
        f"practice again."
    )



# ============================================================
# STROKE ANALYSIS
# ============================================================

def _safe_float(value, default=0.0):
    try:
        number = float(value)
        if np.isfinite(number):
            return number
    except (TypeError, ValueError):
        pass
    return default


def analyze_strokes(strokes):
    """
    Analyze pointer-path stroke data received from DrawingCanvas.

    This analysis is intentionally independent of the five handwriting
    recognition models. It does not alter preprocessing or prediction.
    """
    if not isinstance(strokes, list):
        return {
            "available": False,
            "stroke_count": 0,
            "directions": [],
            "total_path_length": 0.0,
            "average_stroke_length": 0.0,
            "writing_time_ms": 0,
            "average_stroke_speed": 0.0,
            "consistency_score": 0.0,
            "message": "No stroke data was supplied.",
        }

    valid_strokes = []

    for stroke in strokes:
        if not isinstance(stroke, dict):
            continue

        raw_points = stroke.get("points", [])
        if not isinstance(raw_points, list):
            continue

        points = []
        for point in raw_points:
            if not isinstance(point, dict):
                continue

            x = _safe_float(point.get("x"), None)
            y = _safe_float(point.get("y"), None)

            if x is None or y is None:
                continue

            points.append({
                "x": x,
                "y": y,
            })

        if points:
            valid_strokes.append({
                "points": points,
                "createdAt": _safe_float(
                    stroke.get("createdAt"),
                    0.0,
                ),
            })

    stroke_count = len(valid_strokes)

    if stroke_count == 0:
        return {
            "available": False,
            "stroke_count": 0,
            "directions": [],
            "total_path_length": 0.0,
            "average_stroke_length": 0.0,
            "writing_time_ms": 0,
            "average_stroke_speed": 0.0,
            "consistency_score": 0.0,
            "message": "No valid stroke points were supplied.",
        }

    directions = []
    stroke_lengths = []
    all_points = []

    for index, stroke in enumerate(valid_strokes, start=1):
        points = stroke["points"]
        all_points.extend(points)

        length = 0.0

        for point_index in range(1, len(points)):
            dx = points[point_index]["x"] - points[point_index - 1]["x"]
            dy = points[point_index]["y"] - points[point_index - 1]["y"]
            length += float(np.hypot(dx, dy))

        stroke_lengths.append(length)

        if len(points) < 2:
            direction = "point"
        else:
            start = points[0]
            end = points[-1]
            dx = end["x"] - start["x"]
            dy = end["y"] - start["y"]

            angle = np.degrees(np.arctan2(-dy, dx))
            if angle < 0:
                angle += 360

            direction_names = [
                "right",
                "up-right",
                "up",
                "up-left",
                "left",
                "down-left",
                "down",
                "down-right",
            ]

            direction_index = int(
                ((angle + 22.5) % 360) // 45
            )

            direction = direction_names[
                direction_index
            ]

        directions.append({
            "stroke": index,
            "direction": direction,
            "length": round(length, 2),
            "point_count": len(points),
        })

    total_path_length = float(
        sum(stroke_lengths)
    )

    average_stroke_length = (
        total_path_length / stroke_count
        if stroke_count
        else 0.0
    )

    created_times = [
        stroke["createdAt"]
        for stroke in valid_strokes
        if stroke["createdAt"] > 0
    ]

    if len(created_times) >= 2:
        writing_time_ms = max(
            0,
            int(max(created_times) - min(created_times)),
        )
    else:
        writing_time_ms = 0

    if writing_time_ms > 0:
        average_stroke_speed = (
            total_path_length /
            (writing_time_ms / 1000.0)
        )
    else:
        average_stroke_speed = 0.0

    # Basic handwriting geometry metrics. These are calculated from the
    # pointer paths only and do not modify or replace model recognition.
    # Canvas dimensions match DrawingCanvas.jsx.
    canvas_width = 700.0
    canvas_height = 430.0

    xs = [point["x"] for point in all_points]
    ys = [point["y"] for point in all_points]

    bbox_left = min(xs)
    bbox_right = max(xs)
    bbox_top = min(ys)
    bbox_bottom = max(ys)

    bbox_width = max(0.0, bbox_right - bbox_left)
    bbox_height = max(0.0, bbox_bottom - bbox_top)
    aspect_ratio = (
        bbox_width / bbox_height
        if bbox_height > 0
        else 0.0
    )

    bbox_center_x = (bbox_left + bbox_right) / 2.0
    bbox_center_y = (bbox_top + bbox_bottom) / 2.0
    canvas_center_x = canvas_width / 2.0
    canvas_center_y = canvas_height / 2.0

    center_offset_x = abs(bbox_center_x - canvas_center_x) / (canvas_width / 2.0)
    center_offset_y = abs(bbox_center_y - canvas_center_y) / (canvas_height / 2.0)
    centering_score = max(
        0.0,
        min(100.0, 100.0 * (1.0 - (center_offset_x + center_offset_y) / 2.0)),
    )

    width_utilization = (bbox_width / canvas_width) * 100.0
    height_utilization = (bbox_height / canvas_height) * 100.0
    coverage_score = max(
        0.0,
        min(100.0, (width_utilization + height_utilization) / 2.0),
    )

    # Geometry score combines centering and reasonable canvas usage.
    # It is a handwriting-layout score, NOT target-character similarity.
    geometry_score = (centering_score * 0.6) + (coverage_score * 0.4)

    if geometry_score >= 85:
        shape_quality = "Excellent"
    elif geometry_score >= 70:
        shape_quality = "Good"
    elif geometry_score >= 50:
        shape_quality = "Fair"
    else:
        shape_quality = "Needs improvement"

    # A simple consistency indicator based on stroke-length variation.
    # This is descriptive, not a geometric correctness score.
    if stroke_count >= 2 and average_stroke_length > 0:
        std_dev = float(np.std(stroke_lengths))
        coefficient = std_dev / average_stroke_length
        consistency_score = max(
            0.0,
            min(
                100.0,
                100.0 * (1.0 - coefficient),
            ),
        )
    else:
        consistency_score = 100.0

    return {
        "available": True,
        "stroke_count": stroke_count,
        "directions": directions,
        "total_path_length": round(
            total_path_length,
            2,
        ),
        "average_stroke_length": round(
            average_stroke_length,
            2,
        ),
        "writing_time_ms": writing_time_ms,
        "average_stroke_speed": round(
            average_stroke_speed,
            2,
        ),
        "consistency_score": round(
            consistency_score,
            2,
        ),
        "shape_analysis": {
            "available": True,
            "geometry_score": round(geometry_score, 2),
            "shape_quality": shape_quality,
            "bounding_box_width": round(bbox_width, 2),
            "bounding_box_height": round(bbox_height, 2),
            "aspect_ratio": round(aspect_ratio, 2),
            "centering_score": round(centering_score, 2),
            "width_utilization": round(width_utilization, 2),
            "height_utilization": round(height_utilization, 2),
            "coverage_score": round(coverage_score, 2),
            "note": "Geometry-based handwriting layout metrics; not target-character similarity.",
        },
        "message": (
            "Stroke data analyzed successfully."
        ),
    }



def detect_mistakes(stroke_analysis, is_correct, accuracy):
    """
    Detect practical handwriting issues from the already-computed analysis.

    This is a rule-based coaching layer. It does not alter or replace any
    of the five language recognition models.
    """
    issues = []
    suggestions = []

    if not stroke_analysis or not stroke_analysis.get("available"):
        return {
            "available": False,
            "issue_count": 0,
            "severity": "none",
            "issues": [],
            "suggestions": [],
            "message": "No stroke data available for mistake analysis.",
        }

    shape = stroke_analysis.get("shape_analysis") or {}
    geometry = _safe_float(shape.get("geometry_score"), 0.0)
    centering = _safe_float(shape.get("centering_score"), 0.0)
    coverage = _safe_float(shape.get("coverage_score"), 0.0)
    consistency = _safe_float(stroke_analysis.get("consistency_score"), 0.0)
    stroke_count = int(stroke_analysis.get("stroke_count") or 0)
    confidence_accuracy = _safe_float(accuracy, 0.0)

    if not is_correct:
        issues.append({
            "type": "recognition_mismatch",
            "severity": "high",
            "title": "Character mismatch",
            "message": "The handwriting was recognized as a different character.",
        })
        suggestions.append("Rewrite the target character more clearly and follow the guide.")

    if geometry < 50:
        issues.append({
            "type": "shape",
            "severity": "medium",
            "title": "Shape needs improvement",
            "message": "The overall handwriting geometry is quite different in size or placement.",
        })
        suggestions.append("Keep the character centered and use a more consistent size.")
    elif geometry < 70:
        issues.append({
            "type": "shape",
            "severity": "low",
            "title": "Shape could be improved",
            "message": "The character layout is acceptable but can be more consistent.",
        })
        suggestions.append("Try to keep the character's size and placement consistent.")

    if centering < 65:
        issues.append({
            "type": "centering",
            "severity": "medium",
            "title": "Off-center writing",
            "message": "The character is noticeably away from the center of the practice area.",
        })
        suggestions.append("Write closer to the center of the guide area.")

    if coverage < 18:
        issues.append({
            "type": "size",
            "severity": "medium",
            "title": "Character is too small",
            "message": "The handwriting occupies only a small part of the canvas.",
        })
        suggestions.append("Make the character slightly larger while keeping it centered.")
    elif coverage > 88:
        issues.append({
            "type": "size",
            "severity": "medium",
            "title": "Character is too large",
            "message": "The handwriting occupies most of the canvas.",
        })
        suggestions.append("Make the character slightly smaller and leave some space around it.")

    if stroke_count >= 2 and consistency < 55:
        issues.append({
            "type": "consistency",
            "severity": "medium",
            "title": "Uneven stroke lengths",
            "message": "The lengths of your strokes vary considerably.",
        })
        suggestions.append("Try to keep related strokes more consistent in length and movement.")

    if confidence_accuracy < 70 and is_correct:
        issues.append({
            "type": "recognition_confidence",
            "severity": "low",
            "title": "Recognition confidence is moderate",
            "message": "The character matched, but the model confidence was not very high.",
        })
        suggestions.append("Practice the character again with smoother, clearer strokes.")

    severity = "none"
    if any(item["severity"] == "high" for item in issues):
        severity = "high"
    elif any(item["severity"] == "medium" for item in issues):
        severity = "medium"
    elif issues:
        severity = "low"

    if not issues:
        suggestions.append("No major handwriting issues detected. Keep practicing to maintain consistency.")

    return {
        "available": True,
        "issue_count": len(issues),
        "severity": severity,
        "issues": issues,
        "suggestions": suggestions,
        "message": "Mistake analysis completed.",
    }


# ============================================================
# PRACTICE ATTEMPT DATABASE
# ============================================================

DB_PATH = os.path.join(BASE_DIR, "scriptly.db")


def _hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_bytes(16)
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        200_000,
    )
    return salt.hex(), password_hash.hex()


def _verify_password(password, salt_hex, expected_hash_hex):
    try:
        salt = bytes.fromhex(salt_hex)
    except Exception:
        return False
    _, actual_hash = _hash_password(password, salt)
    return hmac.compare_digest(actual_hash, expected_hash_hex)


def _current_user():
    user_id = session.get("user_id")
    if not user_id:
        return None
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    row = conn.execute(
        "SELECT id, name, email, created_at FROM users WHERE id = ?",
        (user_id,),
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def _record_login(user_id):
    """Record one login day for the user. Multiple logins on the same day count once."""
    login_date = datetime.now().date().isoformat()
    conn = sqlite3.connect(DB_PATH)
    try:
        conn.execute(
            """
            INSERT OR IGNORE INTO login_history (user_id, login_date)
            VALUES (?, ?)
            """,
            (user_id, login_date)
        )
        conn.commit()
    finally:
        conn.close()


def _calculate_login_streaks(user_id):
    """Calculate consecutive calendar-day login streaks for one user."""
    conn = sqlite3.connect(DB_PATH)
    rows = conn.execute(
        """
        SELECT login_date
        FROM login_history
        WHERE user_id = ?
        ORDER BY login_date ASC
        """,
        (user_id,)
    ).fetchall()
    conn.close()

    login_dates = set()
    for row in rows:
        try:
            login_dates.add(
                datetime.strptime(str(row[0])[:10], "%Y-%m-%d").date()
            )
        except (TypeError, ValueError):
            continue

    if not login_dates:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "login_days": 0,
            "last_login_date": None,
            "logged_in_today": False,
        }

    sorted_dates = sorted(login_dates)

    best_streak = 1
    running_streak = 1

    for index in range(1, len(sorted_dates)):
        difference = (sorted_dates[index] - sorted_dates[index - 1]).days
        if difference == 1:
            running_streak += 1
        else:
            running_streak = 1
        best_streak = max(best_streak, running_streak)

    today = datetime.now().date()
    logged_in_today = today in login_dates

    if not logged_in_today:
        current_streak = 0
    else:
        current_streak = 1
        check_date = today
        while True:
            previous_date = check_date - timedelta(days=1)
            if previous_date in login_dates:
                current_streak += 1
                check_date = previous_date
            else:
                break

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "login_days": len(login_dates),
        "last_login_date": sorted_dates[-1].isoformat(),
        "logged_in_today": logged_in_today,
    }


def init_database():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE COLLATE NOCASE,
            password_salt TEXT NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            language TEXT NOT NULL,
            character TEXT NOT NULL,
            recognized TEXT,
            confidence REAL,
            accuracy REAL,
            is_correct INTEGER NOT NULL DEFAULT 0,
            stroke_count INTEGER,
            stroke_analysis TEXT,
            mistake_analysis TEXT,
            feedback TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS quiz_attempts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            language TEXT NOT NULL,
            total_questions INTEGER NOT NULL DEFAULT 0,
            correct_answers INTEGER NOT NULL DEFAULT 0,
            incorrect_answers INTEGER NOT NULL DEFAULT 0,
            score REAL NOT NULL DEFAULT 0,
            overall_accuracy REAL NOT NULL DEFAULT 0,
            results TEXT,
            created_at TEXT NOT NULL
        )
    """)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS login_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            login_date TEXT NOT NULL,
            UNIQUE(user_id, login_date)
        )
    """)
    conn.commit()
    conn.close()


def _db_float(value):
    try:
        if value is None or value == "":
            return None
        return float(value)
    except (TypeError, ValueError):
        return None


def _db_json(value):
    try:
        return json.dumps(value, ensure_ascii=False) if value is not None else None
    except (TypeError, ValueError):
        return None


init_database()


@app.route("/auth/register", methods=["POST"])
def register_user():
    data = request.get_json(silent=True) or {}

    name = str(data.get("name", "")).strip()
    email = str(data.get("email", "")).strip().lower()
    phone = str(data.get("phone", "")).strip()
    password = str(data.get("password", ""))

    if not name or not email or not password:
        return jsonify({
            "success": False,
            "message": "Name, email and password are required."
        }), 400

    if "@" not in email or "." not in email.split("@")[-1]:
        return jsonify({
            "success": False,
            "message": "Please enter a valid email address."
        }), 400

    if len(password) < 6:
        return jsonify({
            "success": False,
            "message": "Password must be at least 6 characters."
        }), 400

    # Create secure password
    salt, password_hash = _hash_password(password)
    created_at = datetime.now().isoformat(timespec="seconds")

    conn = sqlite3.connect(DB_PATH)

    try:
        # password = "" is kept only because the old database
        # column is still NOT NULL.
        # The actual password authentication uses
        # password_salt + password_hash.
        cur = conn.execute(
            """
            INSERT INTO users
            (
                name,
                email,
                phone,
                password,
                password_salt,
                password_hash,
                created_at
            )
            VALUES (?, ?, ?, ?, ?, ?, ?)
            """,
            (
                name,
                email,
                phone,
                "",
                salt,
                password_hash,
                created_at
            )
        )

        conn.commit()
        user_id = cur.lastrowid

    except sqlite3.IntegrityError as e:
        conn.rollback()
        conn.close()

        # Only report duplicate email when it actually is one
        if "UNIQUE constraint failed: users.email" in str(e):
            return jsonify({
                "success": False,
                "message": "An account with this email already exists."
            }), 409

        print("Registration database error:", e)

        return jsonify({
            "success": False,
            "message": "Registration failed due to a database error."
        }), 500

    except Exception as e:
        conn.rollback()
        conn.close()

        print("Registration error:", e)

        return jsonify({
            "success": False,
            "message": "Registration failed."
        }), 500

    conn.close()

    # Automatically log the user in after registration
    session.clear()
    session["user_id"] = user_id
    _record_login(user_id)

    return jsonify({
        "success": True,
        "message": "Registration successful.",
        "user": {
            "id": user_id,
            "name": name,
            "email": email,
            "phone": phone,
            "created_at": created_at
        }
    }), 201


@app.route("/auth/login", methods=["POST"])
def login_user():
    data = request.get_json(silent=True) or {}

    email = str(data.get("email", "")).strip().lower()
    password = str(data.get("password", ""))

    if not email or not password:
        return jsonify({
            "success": False,
            "message": "Email and password are required."
        }), 400

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    row = conn.execute(
        """
        SELECT
            id,
            name,
            email,
            phone,
            password,
            password_salt,
            password_hash,
            created_at
        FROM users
        WHERE email = ?
        """,
        (email,)
    ).fetchone()

    if not row:
        conn.close()
        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    valid_password = False

    # --------------------------------------------------------
    # NEW PASSWORD FORMAT
    # --------------------------------------------------------
    if row["password_salt"] and row["password_hash"]:
        valid_password = _verify_password(
            password,
            row["password_salt"],
            row["password_hash"]
        )

    # --------------------------------------------------------
    # OLD PASSWORD FORMAT
    # Used only to migrate existing accounts
    # --------------------------------------------------------
    elif row["password"] is not None:
        valid_password = hmac.compare_digest(
            str(row["password"]),
            password
        )

        # If old password is correct, migrate it
        # to the new secure password format.
        if valid_password:
            salt, password_hash = _hash_password(password)

            conn.execute(
                """
                UPDATE users
                SET password_salt = ?,
                    password_hash = ?,
                    password = NULL,
                    last_login = CURRENT_TIMESTAMP
                WHERE id = ?
                """,
                (
                    salt,
                    password_hash,
                    row["id"]
                )
            )

            conn.commit()

    if not valid_password:
        conn.close()

        return jsonify({
            "success": False,
            "message": "Invalid email or password."
        }), 401

    # Update last login
    conn.execute(
        """
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE id = ?
        """,
        (row["id"],)
    )

    conn.commit()
    conn.close()

    session.clear()
    session["user_id"] = row["id"]
    _record_login(row["id"])

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "user": {
            "id": row["id"],
            "name": row["name"],
            "email": row["email"],
            "phone": row["phone"],
            "created_at": row["created_at"]
        }
    })


@app.route("/auth/me", methods=["GET"])
def auth_me():
    user = _current_user()
    if not user:
        return jsonify({"authenticated": False, "user": None})
    return jsonify({"authenticated": True, "user": user})


@app.route("/auth/logout", methods=["POST"])
def logout_user():
    session.clear()
    return jsonify({"success": True, "message": "Logged out successfully."})


@app.route("/save-attempt", methods=["POST"])
def save_attempt():
    try:
        data = request.get_json(silent=True) or {}

        language = data.get("language")
        character = data.get("character")

        if not language or not character:
            return jsonify({
                "status": "error",
                "message": "Language and character are required."
            }), 400

        stroke_analysis = data.get("stroke_analysis") or data.get("strokeAnalysis")
        stroke_count = None
        if isinstance(stroke_analysis, dict):
            try:
                stroke_count = int(stroke_analysis.get("stroke_count") or 0)
            except (TypeError, ValueError):
                stroke_count = None

        current_user = _current_user()
        if not current_user:
            return jsonify({
                "status": "error",
                "message": "Please log in before saving a practice attempt."
            }), 401

        created_at = datetime.now().isoformat(timespec="seconds")

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.execute("""
            INSERT INTO attempts (
                user_id, language, character, recognized, confidence,
                accuracy, is_correct, stroke_count, stroke_analysis,
                mistake_analysis, feedback, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            current_user["id"],
            str(language),
            str(character),
            data.get("recognized"),
            _db_float(data.get("confidence")),
            _db_float(data.get("accuracy")),
            1 if bool(data.get("is_correct", data.get("isCorrect", False))) else 0,
            stroke_count,
            _db_json(stroke_analysis),
            _db_json(data.get("mistake_analysis") or data.get("mistakeAnalysis")),
            data.get("feedback"),
            created_at,
        ))
        conn.commit()
        attempt_id = cursor.lastrowid
        conn.close()

        return jsonify({
            "status": "success",
            "message": "Practice attempt saved.",
            "attempt_id": attempt_id,
            "created_at": created_at
        }), 201

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "status": "error",
            "message": f"Unable to save practice attempt: {error}"
        }), 500



# ============================================================
# FEATURE #16 - QUIZ / TEST MODE
# ============================================================

QUIZ_SIZE_DEFAULT = 10
QUIZ_SIZE_MAX = 20


def _quiz_characters_for_user(current_user, language=None, count=QUIZ_SIZE_DEFAULT):
    attempts = _load_user_attempts(current_user["id"], limit=10000)
    language_filter = None
    if language:
        raw_language = str(language).strip()
        language_filter = LANGUAGE_ALIASES.get(raw_language, raw_language)

    available = []
    languages = [language_filter] if language_filter else list(LANGUAGE_CONFIG.keys())

    for lang in languages:
        if lang not in LANGUAGE_CONFIG:
            continue
        # Use the same character source as the main /languages and
        # practice-character system. LANGUAGE_CONFIG stores model files,
        # not the character arrays themselves.
        for ch in get_practice_characters(lang):
            ch = str(ch).strip()
            if ch:
                available.append((lang, ch))

    if not available:
        return []

    # Prefer characters the user has practiced, especially weaker ones,
    # while filling the remaining slots from the selected language(s).
    stats = {}
    for a in attempts:
        key = (str(a.get("language", "")), str(a.get("character", "")))
        try:
            acc = float(a.get("accuracy"))
        except (TypeError, ValueError):
            continue
        stats.setdefault(key, []).append(acc)

    scored = []
    for key in available:
        vals = stats.get(key, [])
        if vals:
            avg = sum(vals) / len(vals)
            weakness = max(0.0, 100.0 - avg)
            priority = 100.0 + weakness + (10.0 if len(vals) < 3 else 0.0)
        else:
            priority = 50.0
        scored.append((priority, key))

    scored.sort(key=lambda x: (-x[0], x[1][0], x[1][1]))
    return [{"language": lang, "character": ch} for _, (lang, ch) in scored[:count]]


@app.route("/quiz", methods=["GET", "POST"])
def quiz():
    current_user = _current_user()
    if not current_user:
        return jsonify({"success": False, "status": "error", "message": "Please log in before starting a quiz."}), 401

    data = request.get_json(silent=True) or {} if request.method == "POST" else {}
    language = data.get("language") if isinstance(data, dict) else None
    try:
        count = int(data.get("count", QUIZ_SIZE_DEFAULT)) if isinstance(data, dict) else QUIZ_SIZE_DEFAULT
    except (TypeError, ValueError):
        count = QUIZ_SIZE_DEFAULT
    count = max(1, min(count, QUIZ_SIZE_MAX))

    questions = _quiz_characters_for_user(current_user, language=language, count=count)
    if not questions:
        return jsonify({"success": False, "status": "error", "message": "No quiz characters are available for the selected language."}), 400

    return jsonify({
        "success": True,
        "status": "ready",
        "message": "Personalized quiz generated successfully.",
        "quiz": {
            "question_count": len(questions),
            "questions": [
                {"question_number": i + 1, **q}
                for i, q in enumerate(questions)
            ]
        },
        "user": current_user,
    })


@app.route("/quiz/submit", methods=["POST"])
def submit_quiz():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "status": "error",
            "message": "Please log in before submitting a quiz."
        }), 401

    data = request.get_json(silent=True) or {}
    results = data.get("results")

    if not isinstance(results, list):
        return jsonify({
            "success": False,
            "status": "error",
            "message": "results must be an array."
        }), 400

    quiz_language = str(
        data.get("language") or "All Languages"
    ).strip()

    evaluated = []
    accuracy_values = []
    correct = 0
    total = 0

    for index, item in enumerate(results, start=1):
        if not isinstance(item, dict):
            continue

        total += 1

        try:
            accuracy = float(
                item.get("accuracy", 0)
            )
        except (TypeError, ValueError):
            accuracy = 0.0

        accuracy = max(
            0.0,
            min(100.0, accuracy)
        )

        is_correct = bool(
            item.get(
                "is_correct",
                item.get(
                    "isCorrect",
                    accuracy >= 80
                )
            )
        )

        if is_correct:
            correct += 1

        accuracy_values.append(
            accuracy
        )

        evaluated.append({
            "question_number": item.get(
                "question_number",
                index
            ),
            "language": item.get(
                "language"
            ),
            "character": item.get(
                "character"
            ),
            "recognized": item.get(
                "recognized"
            ),
            "accuracy": round(
                accuracy,
                2
            ),
            "confidence": item.get(
                "confidence"
            ),
            "is_correct": is_correct,
            "feedback": item.get(
                "feedback"
            ) or (
                "Good work."
                if is_correct
                else
                "Practice this character again and focus on its shape."
            ),
        })

    incorrect = max(
        0,
        total - correct
    )

    score = round(
        (correct / total) * 100,
        2
    ) if total else 0.0

    overall_accuracy = round(
        sum(accuracy_values) /
        len(accuracy_values),
        2
    ) if accuracy_values else 0.0

    completed_at = datetime.now().isoformat(
        timespec="seconds"
    )

    # Save one complete quiz attempt.
    conn = sqlite3.connect(DB_PATH)

    cursor = conn.execute("""
        INSERT INTO quiz_attempts (
            user_id,
            language,
            total_questions,
            correct_answers,
            incorrect_answers,
            score,
            overall_accuracy,
            results,
            created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, (
        current_user["id"],
        quiz_language,
        total,
        correct,
        incorrect,
        score,
        overall_accuracy,
        json.dumps(
            evaluated,
            ensure_ascii=False
        ),
        completed_at,
    ))

    conn.commit()
    quiz_attempt_id = cursor.lastrowid
    conn.close()

    return jsonify({
        "success": True,
        "status": "completed",
        "message": "Quiz submitted and saved successfully.",
        "quiz_result": {
            "attempt_id": quiz_attempt_id,
            "language": quiz_language,
            "total_questions": total,
            "correct_answers": correct,
            "incorrect_answers": incorrect,
            "score": score,
            "percentage": score,
            "overall_accuracy": overall_accuracy,
            "completed_at": completed_at,
            "results": evaluated,
        },
        "user": current_user,
    })


@app.route("/quiz/performance", methods=["GET"])
def get_quiz_performance():
    """Return quiz-only performance for the logged-in user."""
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "status": "error",
            "message": "Please log in to view quiz performance."
        }), 401

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT
            id,
            language,
            total_questions,
            correct_answers,
            incorrect_answers,
            score,
            overall_accuracy,
            created_at
        FROM quiz_attempts
        WHERE user_id = ?
        ORDER BY id DESC
    """, (current_user["id"],)).fetchall()

    conn.close()

    attempts = [dict(row) for row in rows]

    total_quizzes = len(attempts)
    total_questions = sum(
        int(item.get("total_questions") or 0)
        for item in attempts
    )
    total_correct = sum(
        int(item.get("correct_answers") or 0)
        for item in attempts
    )

    scores = [
        float(item.get("score") or 0)
        for item in attempts
    ]
    accuracies = [
        float(item.get("overall_accuracy") or 0)
        for item in attempts
    ]

    average_score = (
        round(sum(scores) / len(scores), 2)
        if scores else 0.0
    )

    best_score = (
        round(max(scores), 2)
        if scores else 0.0
    )

    average_accuracy = (
        round(sum(accuracies) / len(accuracies), 2)
        if accuracies else 0.0
    )

    question_accuracy = (
        round(
            (total_correct / total_questions) * 100,
            2
        )
        if total_questions else 0.0
    )

    # Separate statistics for each quiz language.
    language_stats = {}

    for item in attempts:
        language = str(
            item.get("language") or "Unknown"
        )

        stats = language_stats.setdefault(
            language,
            {
                "language": language,
                "quiz_count": 0,
                "total_questions": 0,
                "correct_answers": 0,
                "score_sum": 0.0,
                "accuracy_sum": 0.0,
            }
        )

        stats["quiz_count"] += 1
        stats["total_questions"] += int(
            item.get("total_questions") or 0
        )
        stats["correct_answers"] += int(
            item.get("correct_answers") or 0
        )
        stats["score_sum"] += float(
            item.get("score") or 0
        )
        stats["accuracy_sum"] += float(
            item.get("overall_accuracy") or 0
        )

    for stats in language_stats.values():
        count = stats["quiz_count"]
        questions = stats["total_questions"]

        stats["average_score"] = round(
            stats["score_sum"] / count,
            2
        ) if count else 0.0

        stats["average_accuracy"] = round(
            stats["accuracy_sum"] / count,
            2
        ) if count else 0.0

        stats["question_accuracy"] = round(
            (
                stats["correct_answers"] /
                questions
            ) * 100,
            2
        ) if questions else 0.0

        del stats["score_sum"]
        del stats["accuracy_sum"]

    # Trend is chronological, oldest -> newest.
    chronological = list(
        reversed(attempts)
    )

    trend = [
        {
            "attempt_id": item["id"],
            "language": item["language"],
            "score": float(
                item.get("score") or 0
            ),
            "accuracy": float(
                item.get("overall_accuracy") or 0
            ),
            "created_at": item["created_at"],
        }
        for item in chronological
    ]

    return jsonify({
        "success": True,
        "performance": {
            "total_quizzes": total_quizzes,
            "total_questions": total_questions,
            "total_correct": total_correct,
            "average_score": average_score,
            "best_score": best_score,
            "average_accuracy": average_accuracy,
            "question_accuracy": question_accuracy,
            "language_stats": list(
                language_stats.values()
            ),
            "trend": trend,
            "recent_attempts": attempts[:10],
        },
    })


@app.route("/quiz/attempts", methods=["GET"])
def get_quiz_attempts():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "status": "error",
            "message": "Please log in to view quiz history."
        }), 401

    try:
        limit = int(
            request.args.get(
                "limit",
                20
            )
        )
    except (TypeError, ValueError):
        limit = 20

    limit = max(
        1,
        min(limit, 100)
    )

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT
            id,
            language,
            total_questions,
            correct_answers,
            incorrect_answers,
            score,
            overall_accuracy,
            results,
            created_at
        FROM quiz_attempts
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (
        current_user["id"],
        limit
    )).fetchall()

    conn.close()

    attempts = []

    for row in rows:
        item = dict(row)

        try:
            item["results"] = (
                json.loads(item["results"])
                if item.get("results")
                else []
            )
        except (
            TypeError,
            ValueError,
            json.JSONDecodeError
        ):
            item["results"] = []

        attempts.append(item)

    return jsonify({
        "success": True,
        "attempts": attempts,
        "count": len(attempts),
    })



# ============================================================
# ROOT
# ============================================================

@app.route(
    "/",
    methods=["GET"]
)
def home():

    return jsonify({

        "status": "success",

        "message":
            "Scriptly AI Handwriting Backend is running",

        "languages":
            list(
                LANGUAGE_CONFIG.keys()
            ),

        "models": {
            language:
                language in models
            for language in LANGUAGE_CONFIG
        },

        "classes": {
            language:
                len(
                    get_practice_characters(
                        language
                    )
                )
            for language in LANGUAGE_CONFIG
        }
    })


# ============================================================
# HEALTH
# ============================================================

@app.route(
    "/health",
    methods=["GET"]
)
def health():

    return jsonify({

        "status": "healthy",

        "models": {
            language:
                language in models
            for language in LANGUAGE_CONFIG
        },

        "classes": {
            language:
                len(
                    get_practice_characters(
                        language
                    )
                )
            for language in LANGUAGE_CONFIG
        }
    })


# ============================================================
# LANGUAGES
# ============================================================

@app.route(
    "/languages",
    methods=["GET"]
)
def get_languages():

    language_data = {}

    for language in LANGUAGE_CONFIG:

        language_data[
            language
        ] = get_practice_characters(
            language
        )

    return jsonify({

        "status": "success",

        "languages":
            language_data
    })


# ============================================================
# RECOGNIZE
# ============================================================

@app.route(
    "/recognize",
    methods=["POST"]
)
def recognize():

    return predict()


# ============================================================
# PREDICT
# ============================================================

@app.route(
    "/predict",
    methods=["POST"]
)
def predict():

    try:

        # ====================================================
        # REQUEST
        # ====================================================

        data = request.get_json(
            silent=True
        )

        if not data:

            return jsonify({

                "status": "error",

                "message":
                    "No JSON data received."

            }), 400

        # ====================================================
        # LANGUAGE
        # ====================================================

        requested_language = data.get(
            "language"
        )

        if not requested_language:

            return jsonify({

                "status": "error",

                "message":
                    "Language is required."

            }), 400

        language = LANGUAGE_ALIASES.get(
            requested_language
        )

        if not language:

            return jsonify({

                "status": "error",

                "message":
                    f"Unsupported language: "
                    f"{requested_language}"

            }), 400

        # ====================================================
        # MODEL CHECK
        # ====================================================

        if language not in models:

            return jsonify({

                "status": "error",

                "message":
                    f"{language} model is not loaded."

            }), 500

        # ====================================================
        # TARGET
        # ====================================================

        target_raw = data.get(
            "character"
        )

        if not target_raw:

            return jsonify({

                "status": "error",

                "message":
                    "Character is required."

            }), 400

        target = normalize_target_character(
            language,
            target_raw
        )

        # ====================================================
        # IMAGE
        # ====================================================

        image_data = data.get(
            "image"
        )

        if not image_data:

            return jsonify({

                "status": "error",

                "message":
                    "Handwriting image is required."

            }), 400

        # ====================================================
        # STROKES
        # ====================================================

        strokes = data.get(
            "strokes",
            []
        )

        stroke_analysis = analyze_strokes(
            strokes
        )

        # Mistake analysis is calculated after recognition below.
        # A placeholder is replaced before the response is returned.
        mistake_analysis = None

        # ====================================================
        # CONFIG
        # ====================================================

        config = LANGUAGE_CONFIG[
            language
        ]

        img_size = config[
            "input_size"
        ]

        invert = config[
            "invert"
        ]

        # ====================================================
        # PREPROCESS
        # ====================================================

        processed_image = preprocess_image(
            image_data,
            img_size,
            invert
        )

        # ====================================================
        # PREDICTION
        # ====================================================

        model = models[
            language
        ]

        prediction = model.predict(
            processed_image,
            verbose=0
        )

        probabilities = prediction[
            0
        ]

        # ====================================================
        # TOP 5
        # ====================================================

        top_count = min(
            5,
            len(
                probabilities
            )
        )

        top_indices = np.argsort(
            probabilities
        )[
            -top_count:
        ][::-1]

        top_predictions = []

        for index in top_indices:

            index = int(
                index
            )

            predicted_character = decode_prediction(
                language,
                index
            )

            prediction_confidence = (
                float(
                    probabilities[index]
                ) *
                100
            )

            top_predictions.append({

                "character":
                    predicted_character,

                "confidence":
                    round(
                        prediction_confidence,
                        2
                    )
            })

        # ====================================================
        # MAIN RESULT
        # ====================================================

        if top_predictions:

            recognized_raw = (
                top_predictions[0][
                    "character"
                ]
            )

            confidence = (
                top_predictions[0][
                    "confidence"
                ]
            )

        else:

            recognized_raw = "--"

            confidence = 0.0

        # ====================================================
        # NORMALIZE RECOGNIZED
        # ====================================================

        recognized = normalize_recognized_character(
            language,
            recognized_raw
        )

        # ====================================================
        # TARGET / RECOGNIZED CANONICAL
        # ====================================================

        target_canonical = normalize_target_character(
            language,
            target
        )

        recognized_canonical = normalize_recognized_character(
            language,
            recognized
        )

        # ====================================================
        # CORRECT
        # ====================================================

        is_correct = (
            recognized_canonical ==
            target_canonical
        )

        # ====================================================
        # ACCURACY
        # ====================================================

        if is_correct:

            accuracy = round(
                confidence,
                2
            )

        else:

            accuracy = 0.0

        # ====================================================
        # FEEDBACK
        # ====================================================

        feedback = generate_feedback(
            recognized,
            target,
            confidence,
            is_correct
        )

        # ====================================================
        # DEBUG
        # ====================================================

        print()
        print(
            "=" * 50
        )

        print(
            "SCRIPTLY PREDICTION"
        )

        print(
            "=" * 50
        )

        print(
            "Language:",
            language
        )

        print(
            "Target raw:",
            target_raw
        )

        print(
            "Target normalized:",
            target
        )

        print(
            "Recognized:",
            recognized
        )

        print(
            "Confidence:",
            confidence
        )

        mistake_analysis = detect_mistakes(
            stroke_analysis,
            is_correct,
            accuracy,
        )

        print(
            "Correct:",
            is_correct
        )

        print(
            "Accuracy:",
            accuracy
        )

        print(
            "Stroke count:",
            stroke_analysis.get(
                "stroke_count",
                0
            )
        )

        print(
            "Input size:",
            img_size
        )

        print(
            "Invert:",
            invert
        )

        print(
            "Top predictions:"
        )

        for item in top_predictions:

            print(
                f"  {item['character']}: "
                f"{item['confidence']}%"
            )

        print(
            "=" * 50
        )

        # ====================================================
        # RESPONSE
        # ====================================================

        return jsonify({

            "status":
                "success",

            "language":
                language,

            "target":
                target_raw,

            "target_display":
                target,

            "recognized":
                recognized,

            "confidence":
                confidence,

            "accuracy":
                accuracy,

            "is_correct":
                is_correct,

            "top_predictions":
                top_predictions,

            "feedback":
                feedback,

            "stroke_analysis":
                stroke_analysis,

            "mistake_analysis":
                mistake_analysis
        })

    # ========================================================
    # VALUE ERROR
    # ========================================================

    except ValueError as error:

        print(
            f"[PREDICTION ERROR] {error}"
        )

        return jsonify({

            "status":
                "error",

            "message":
                str(error)

        }), 400

    # ========================================================
    # GENERAL ERROR
    # ========================================================

    except Exception as error:

        print(
            f"[SERVER ERROR] {error}"
        )

        traceback.print_exc()

        return jsonify({

            "status":
                "error",

            "message":
                "An unexpected error occurred "
                "while analyzing the handwriting."

        }), 500



# ============================================================
# FEATURE #10 — BEFORE VS AFTER COMPARISON
# ============================================================

def _build_before_after_comparison(current_user):
    """Compare the user's earliest and latest handwriting performance.

    The comparison uses only the logged-in user's saved practice attempts.
    For each practiced character, the first recorded accuracy is compared
    with the most recent recorded accuracy. Language and overall summaries
    use the same first-vs-latest approach.
    """
    attempts = _load_user_attempts(current_user["id"], limit=10000)

    if not attempts:
        return {
            "has_data": False,
            "message": "Practice a character to see your before vs after comparison.",
            "summary": {
                "total_attempts": 0,
                "characters_compared": 0,
                "languages_compared": 0,
                "improved_characters": 0,
                "declined_characters": 0,
                "unchanged_characters": 0,
            },
            "overall": None,
            "languages": [],
            "characters": [],
        }

    # _load_user_attempts returns newest-first, so reverse it to process
    # attempts chronologically from the user's earliest practice onward.
    chronological = list(reversed(attempts))

    def safe_accuracy(value):
        try:
            return max(0.0, min(100.0, float(value)))
        except (TypeError, ValueError):
            return None

    character_data = {}
    language_data = {}
    valid_overall = []

    for attempt in chronological:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language not in LANGUAGE_CONFIG:
            continue

        character = str(
            normalize_target_character(
                language,
                attempt.get("character", "")
            )
        ).strip()

        if not character:
            continue

        accuracy = safe_accuracy(attempt.get("accuracy"))
        if accuracy is None:
            continue

        valid_overall.append(accuracy)

        key = (language, character)
        if key not in character_data:
            character_data[key] = {
                "language": language,
                "character": character,
                "before_accuracy": accuracy,
                "after_accuracy": accuracy,
                "attempts": 0,
                "first_practiced": attempt.get("created_at"),
                "last_practiced": attempt.get("created_at"),
                "first_feedback": attempt.get("feedback"),
                "latest_feedback": attempt.get("feedback"),
            }

        entry = character_data[key]
        entry["attempts"] += 1
        entry["after_accuracy"] = accuracy
        entry["last_practiced"] = attempt.get("created_at")
        entry["latest_feedback"] = attempt.get("feedback")

        if language not in language_data:
            language_data[language] = {
                "language": language,
                "before_values": [],
                "latest_values": [],
                "attempts": 0,
            }

        lang_entry = language_data[language]
        lang_entry["attempts"] += 1

    # Build language before/after values from each character's first/latest
    # recorded result. This prevents characters with many attempts from
    # dominating the language comparison.
    for entry in character_data.values():
        lang_entry = language_data[entry["language"]]
        lang_entry["before_values"].append(entry["before_accuracy"])
        lang_entry["latest_values"].append(entry["after_accuracy"])

    character_results = []
    improved = 0
    declined = 0
    unchanged = 0

    for entry in character_data.values():
        before = entry["before_accuracy"]
        after = entry["after_accuracy"]
        improvement = after - before

        if improvement > 0.05:
            status = "Improved"
            improved += 1
        elif improvement < -0.05:
            status = "Declined"
            declined += 1
        else:
            status = "Unchanged"
            unchanged += 1

        character_results.append({
            "language": entry["language"],
            "character": entry["character"],
            "before_accuracy": round(before, 1),
            "after_accuracy": round(after, 1),
            "improvement": round(improvement, 1),
            "status": status,
            "attempts": entry["attempts"],
            "first_practiced": entry["first_practiced"],
            "last_practiced": entry["last_practiced"],
            "first_feedback": entry["first_feedback"],
            "latest_feedback": entry["latest_feedback"],
        })

    character_results.sort(
        key=lambda item: (
            -item["improvement"],
            item["language"],
            item["character"]
        )
    )

    language_results = []
    for language, entry in language_data.items():
        before_values = entry["before_values"]
        after_values = entry["latest_values"]

        before = (
            sum(before_values) / len(before_values)
            if before_values else 0.0
        )
        after = (
            sum(after_values) / len(after_values)
            if after_values else 0.0
        )
        improvement = after - before

        if improvement > 0.05:
            status = "Improved"
        elif improvement < -0.05:
            status = "Declined"
        else:
            status = "Unchanged"

        language_results.append({
            "language": language,
            "before_accuracy": round(before, 1),
            "after_accuracy": round(after, 1),
            "improvement": round(improvement, 1),
            "status": status,
            "characters_compared": len(before_values),
            "attempts": entry["attempts"],
        })

    language_results.sort(key=lambda item: item["language"])

    # Overall comparison is based on the user's first and latest recorded
    # result for each practiced character, giving every character equal
    # weight in the before/after view.
    overall_before_values = [
        item["before_accuracy"] for item in character_results
    ]
    overall_after_values = [
        item["after_accuracy"] for item in character_results
    ]

    overall_before = (
        sum(overall_before_values) / len(overall_before_values)
        if overall_before_values else 0.0
    )
    overall_after = (
        sum(overall_after_values) / len(overall_after_values)
        if overall_after_values else 0.0
    )
    overall_improvement = overall_after - overall_before

    if overall_improvement > 0.05:
        overall_status = "Improved"
    elif overall_improvement < -0.05:
        overall_status = "Declined"
    else:
        overall_status = "Unchanged"

    return {
        "has_data": bool(character_results),
        "message": "Before vs after comparison calculated from your practice history.",
        "summary": {
            "total_attempts": len(attempts),
            "characters_compared": len(character_results),
            "languages_compared": len(language_results),
            "improved_characters": improved,
            "declined_characters": declined,
            "unchanged_characters": unchanged,
        },
        "overall": {
            "before_accuracy": round(overall_before, 1),
            "after_accuracy": round(overall_after, 1),
            "improvement": round(overall_improvement, 1),
            "status": overall_status,
            "characters_compared": len(character_results),
        },
        "languages": language_results,
        "characters": character_results,
    }


@app.route("/before-after", methods=["GET"])
def get_before_after_comparison():
    """Return personalized before-vs-after practice performance."""
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your before vs after comparison."
        }), 401

    try:
        result = _build_before_after_comparison(current_user)

        return jsonify({
            "success": True,
            "message": "Before vs after comparison calculated successfully.",
            "user": current_user,
            **result,
        })

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": f"Unable to calculate before vs after comparison: {error}"
        }), 500


@app.route("/before-after-comparison", methods=["GET"])
def get_before_after_comparison_alias():
    """Compatibility alias for the before-after comparison endpoint."""
    return get_before_after_comparison()



# ============================================================
# FEATURE #11 — WRITING SPEED ANALYSIS
# ============================================================

def _build_writing_speed_analysis(current_user):
    """Build personalized writing-speed analytics from saved stroke data."""
    attempts = _load_user_attempts(current_user["id"], limit=10000)

    speed_records = []
    for attempt in attempts:
        analysis = attempt.get("stroke_analysis")
        if not isinstance(analysis, dict) or not analysis.get("available"):
            continue

        speed = _safe_float(analysis.get("average_stroke_speed"), 0.0)
        writing_time = _safe_float(analysis.get("writing_time_ms"), 0.0)
        path_length = _safe_float(analysis.get("total_path_length"), 0.0)
        stroke_count = int(_safe_float(analysis.get("stroke_count"), 0.0))

        if speed <= 0 and writing_time > 0 and path_length > 0:
            speed = path_length / (writing_time / 1000.0)

        if speed <= 0 and writing_time <= 0:
            continue

        speed_records.append({
            "id": attempt.get("id"),
            "language": attempt.get("language"),
            "character": attempt.get("character"),
            "accuracy": round(_safe_float(attempt.get("accuracy"), 0.0), 1),
            "is_correct": bool(attempt.get("is_correct")),
            "average_stroke_speed": round(speed, 2),
            "writing_time_ms": round(writing_time, 2),
            "writing_time_seconds": round(writing_time / 1000.0, 2),
            "stroke_count": stroke_count,
            "created_at": attempt.get("created_at"),
        })

    if not speed_records:
        return {
            "has_data": False,
            "summary": {
                "speed_records": 0,
                "average_speed": 0.0,
                "average_writing_time_seconds": 0.0,
                "fastest_speed": 0.0,
                "slowest_speed": 0.0,
            },
            "characters": [],
            "languages": [],
            "recent_attempts": [],
        }

    speeds = [r["average_stroke_speed"] for r in speed_records if r["average_stroke_speed"] > 0]
    times = [r["writing_time_seconds"] for r in speed_records if r["writing_time_seconds"] > 0]

    def group_stats(key):
        groups = {}
        for record in speed_records:
            group = record.get(key) or "Unknown"
            groups.setdefault(group, []).append(record)

        result = []
        for group, records in groups.items():
            group_speeds = [r["average_stroke_speed"] for r in records if r["average_stroke_speed"] > 0]
            group_times = [r["writing_time_seconds"] for r in records if r["writing_time_seconds"] > 0]
            result.append({
                key: group,
                "attempts": len(records),
                "average_speed": round(sum(group_speeds) / len(group_speeds), 2) if group_speeds else 0.0,
                "average_writing_time_seconds": round(sum(group_times) / len(group_times), 2) if group_times else 0.0,
                "fastest_speed": round(max(group_speeds), 2) if group_speeds else 0.0,
                "accuracy": round(sum(r["accuracy"] for r in records) / len(records), 1),
            })
        return sorted(result, key=lambda x: x["average_speed"], reverse=True)

    chronological = list(reversed(speed_records))
    first_speed = chronological[0]["average_stroke_speed"]
    latest_speed = chronological[-1]["average_stroke_speed"]
    speed_change = latest_speed - first_speed

    return {
        "has_data": True,
        "message": "Writing speed analysis calculated from saved stroke data.",
        "summary": {
            "speed_records": len(speed_records),
            "average_speed": round(sum(speeds) / len(speeds), 2) if speeds else 0.0,
            "average_writing_time_seconds": round(sum(times) / len(times), 2) if times else 0.0,
            "fastest_speed": round(max(speeds), 2) if speeds else 0.0,
            "slowest_speed": round(min(speeds), 2) if speeds else 0.0,
            "first_speed": round(first_speed, 2),
            "latest_speed": round(latest_speed, 2),
            "speed_change": round(speed_change, 2),
            "speed_change_percent": round((speed_change / first_speed) * 100.0, 1) if first_speed > 0 else 0.0,
        },
        "characters": group_stats("character"),
        "languages": group_stats("language"),
        "recent_attempts": speed_records[:10],
    }


@app.route("/writing-speed", methods=["GET"])
def get_writing_speed():
    """Return personalized writing-speed analytics."""
    current_user = _current_user()
    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view writing speed analysis."
        }), 401

    try:
        result = _build_writing_speed_analysis(current_user)
        return jsonify({
            "success": True,
            "message": "Writing speed analysis calculated successfully.",
            "user": current_user,
            **result,
        })
    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to calculate writing speed analysis: {error}"
        }), 500


@app.route("/writing-speed-analysis", methods=["GET"])
def get_writing_speed_alias():
    """Compatibility alias for writing speed analysis."""
    return get_writing_speed()



# ============================================================
# FEATURE #12 — DAILY / WEEKLY / MONTHLY PROGRESS
# ============================================================

def _build_period_progress(current_user):
    """Build personalized daily, weekly, and monthly progress analytics."""
    attempts = _load_user_attempts(current_user["id"], limit=10000)
    now = datetime.now()
    today = now.date()

    def parse_date(value):
        if not value:
            return None
        try:
            return datetime.fromisoformat(str(value).replace("Z", "+00:00")).date()
        except (TypeError, ValueError):
            try:
                return datetime.strptime(str(value)[:10], "%Y-%m-%d").date()
            except (TypeError, ValueError):
                return None

    def stats(records):
        accuracies = [_safe_float(a.get("accuracy"), 0.0) for a in records]
        correct = sum(1 for a in records if bool(a.get("is_correct")))
        languages = sorted({str(a.get("language")) for a in records if a.get("language")})
        characters = sorted({str(a.get("character")) for a in records if a.get("character")})
        return {
            "attempts": len(records),
            "correct_attempts": correct,
            "accuracy": round(sum(accuracies) / len(accuracies), 1) if accuracies else 0.0,
            "languages_practiced": len(languages),
            "characters_practiced": len(characters),
        }

    dated = []
    for attempt in attempts:
        d = parse_date(attempt.get("created_at"))
        if d:
            dated.append((d, attempt))

    def period_records(start_date, end_date):
        return [a for d, a in dated if start_date <= d <= end_date]

    day_records = period_records(today, today)
    week_start = today - timedelta(days=today.weekday())
    week_records = period_records(week_start, today)
    month_start = today.replace(day=1)
    month_records = period_records(month_start, today)

    # Daily progress for the current month, including zero-activity days.
    daily = []
    for offset in range((today - month_start).days + 1):
        d = month_start + timedelta(days=offset)
        records = period_records(d, d)
        item = stats(records)
        item["date"] = d.isoformat()
        daily.append(item)

    # Weekly progress for the last 8 completed/current calendar weeks.
    weekly = []
    current_week_start = week_start
    for index in range(7, -1, -1):
        start = current_week_start - timedelta(days=index * 7)
        end = start + timedelta(days=6)
        records = period_records(start, min(end, today))
        item = stats(records)
        item["week_start"] = start.isoformat()
        item["week_end"] = end.isoformat()
        item["is_current_week"] = start == current_week_start
        weekly.append(item)

    # Monthly progress for the last 6 calendar months.
    monthly = []
    cursor = today.replace(day=1)
    month_starts = []
    for _ in range(6):
        month_starts.append(cursor)
        previous_month_last_day = cursor - timedelta(days=1)
        cursor = previous_month_last_day.replace(day=1)
    month_starts.reverse()

    for start in month_starts:
        if start.month == 12:
            next_start = start.replace(year=start.year + 1, month=1, day=1)
        else:
            next_start = start.replace(month=start.month + 1, day=1)
        end = next_start - timedelta(days=1)
        records = period_records(start, min(end, today))
        item = stats(records)
        item["month"] = start.strftime("%Y-%m")
        item["month_name"] = start.strftime("%B %Y")
        item["is_current_month"] = start == month_start
        monthly.append(item)

    # Compare the current period with the immediately preceding period.
    yesterday = today - timedelta(days=1)
    previous_day = stats(period_records(yesterday, yesterday))

    previous_week_start = week_start - timedelta(days=7)
    previous_week_end = week_start - timedelta(days=1)
    previous_week = stats(period_records(previous_week_start, previous_week_end))

    previous_month_end = month_start - timedelta(days=1)
    previous_month_start = previous_month_end.replace(day=1)
    previous_month = stats(period_records(previous_month_start, previous_month_end))

    def change(current, previous):
        return {
            "attempts_change": current["attempts"] - previous["attempts"],
            "accuracy_change": round(current["accuracy"] - previous["accuracy"], 1),
            "correct_attempts_change": current["correct_attempts"] - previous["correct_attempts"],
        }

    return {
        "has_data": bool(attempts),
        "message": "Daily, weekly, and monthly progress calculated from your practice history.",
        "current": {
            "date": today.isoformat(),
            "day": stats(day_records),
            "week": {
                "start": week_start.isoformat(),
                "end": today.isoformat(),
                **stats(week_records),
            },
            "month": {
                "start": month_start.isoformat(),
                "end": today.isoformat(),
                **stats(month_records),
            },
        },
        "comparisons": {
            "day_vs_previous_day": change(stats(day_records), previous_day),
            "week_vs_previous_week": change(stats(week_records), previous_week),
            "month_vs_previous_month": change(stats(month_records), previous_month),
        },
        "daily": daily,
        "weekly": weekly,
        "monthly": monthly,
    }


@app.route("/period-progress", methods=["GET"])
def get_period_progress():
    """Return personalized daily, weekly, and monthly progress."""
    current_user = _current_user()
    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your daily, weekly, and monthly progress."
        }), 401

    try:
        result = _build_period_progress(current_user)
        return jsonify({
            "success": True,
            "message": "Daily, weekly, and monthly progress calculated successfully.",
            "user": current_user,
            **result,
        })
    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to calculate period progress: {error}"
        }), 500


@app.route("/daily-weekly-monthly-progress", methods=["GET"])
def get_daily_weekly_monthly_progress():
    """Compatibility alias for daily/weekly/monthly progress."""
    return get_period_progress()



# ============================================================
# FEATURE #13 — PERSONALIZED AI SUMMARY
# ============================================================

def _build_personalized_ai_summary(current_user):
    """Build a personalized learning summary from the user's real practice data."""
    attempts = _load_user_attempts(current_user["id"], limit=10000)

    if not attempts:
        return {
            "has_data": False,
            "summary": "Start practicing to generate your personalized learning summary.",
            "headline": "Your learning journey is ready to begin.",
            "insights": [],
            "recommendations": ["Practice your first character to start building personalized insights."],
            "metrics": {
                "total_attempts": 0,
                "overall_accuracy": 0.0,
                "correct_attempts": 0,
                "languages_practiced": 0,
                "characters_practiced": 0,
            },
        }

    def accuracy(record):
        return max(0.0, min(100.0, _safe_float(record.get("accuracy"), 0.0)))

    chronological = list(reversed(attempts))
    accuracies = [accuracy(a) for a in attempts]
    overall = sum(accuracies) / len(accuracies)
    correct = sum(1 for a in attempts if bool(a.get("is_correct")))
    languages = sorted({str(a.get("language")) for a in attempts if a.get("language")})
    characters = sorted({(str(a.get("language")), str(a.get("character"))) for a in attempts if a.get("language") and a.get("character")})

    # Compare the first three attempts with the latest three attempts.
    first_group = chronological[:min(3, len(chronological))]
    latest_group = chronological[-min(3, len(chronological)):]
    before = sum(accuracy(a) for a in first_group) / len(first_group)
    after = sum(accuracy(a) for a in latest_group) / len(latest_group)
    change = after - before

    # Character-level performance.
    grouped = {}
    for attempt in chronological:
        key = (str(attempt.get("language") or "Unknown"), str(attempt.get("character") or "Unknown"))
        grouped.setdefault(key, []).append(attempt)

    character_stats = []
    for (language, character), records in grouped.items():
        avg = sum(accuracy(a) for a in records) / len(records)
        latest = accuracy(records[-1])
        character_stats.append({
            "language": language,
            "character": character,
            "attempts": len(records),
            "accuracy": round(avg, 1),
            "latest_accuracy": round(latest, 1),
        })

    weakest = sorted(character_stats, key=lambda x: (x["accuracy"], x["latest_accuracy"]))[:3]
    strongest = sorted(character_stats, key=lambda x: (x["accuracy"], x["attempts"]), reverse=True)[:3]

    # Recent trend based on up to the latest five attempts.
    recent = accuracies[:min(5, len(accuracies))]
    recent_average = sum(recent) / len(recent)
    older = accuracies[min(5, len(accuracies)):min(10, len(accuracies))]
    trend = recent_average - (sum(older) / len(older) if older else overall)

    insights = []
    recommendations = []

    if change >= 10:
        insights.append(f"Your recent accuracy is {change:.1f} percentage points higher than your first practice attempts.")
    elif change <= -10:
        insights.append(f"Your recent accuracy is {abs(change):.1f} percentage points lower than your first practice attempts.")
    else:
        insights.append("Your recent accuracy is relatively stable compared with your first practice attempts.")

    if trend >= 5:
        insights.append("Your recent practice results show an upward accuracy trend.")
    elif trend <= -5:
        insights.append("Your recent practice results show a downward accuracy trend.")
    else:
        insights.append("Your recent accuracy trend is relatively stable.")

    if weakest:
        weak_text = ", ".join(f"{x['character']} ({x['accuracy']:.1f}%)" for x in weakest)
        insights.append(f"Characters currently needing the most attention: {weak_text}.")
        recommendations.append(f"Focus your next practice session on {weakest[0]['character']} to improve your weakest character.")

    if strongest:
        strong_text = ", ".join(f"{x['character']} ({x['accuracy']:.1f}%)" for x in strongest)
        insights.append(f"Your strongest practiced characters include {strong_text}.")

    if len(languages) < 5:
        recommendations.append(f"You have practiced {len(languages)} of 5 languages. Try another language to broaden your coverage.")
    else:
        insights.append("You have practiced all 5 supported languages.")

    if overall < 60:
        recommendations.append("Use guided repetition and focus on overall character shape before increasing difficulty.")
    elif overall < 80:
        recommendations.append("Continue regular practice and use feedback to improve consistency toward 80%+ accuracy.")
    else:
        recommendations.append("Maintain your accuracy while gradually practicing harder or less familiar characters.")

    if len(attempts) < 10:
        recommendations.append("Complete more practice attempts so your personalized trends become more reliable.")

    if not recommendations:
        recommendations.append("Continue practicing regularly and review your feedback after each attempt.")

    headline = (
        "Strong recent progress." if change >= 10 else
        "Keep building consistency." if change > -10 else
        "Your recent results need attention."
    )

    summary = (
        f"You have completed {len(attempts)} practice attempts across {len(languages)} languages "
        f"and {len(characters)} characters, with an overall accuracy of {overall:.1f}%. "
        f"Your recent accuracy is {after:.1f}%, compared with {before:.1f}% across your first practice attempts."
    )

    return {
        "has_data": True,
        "headline": headline,
        "summary": summary,
        "insights": insights,
        "recommendations": recommendations[:5],
        "metrics": {
            "total_attempts": len(attempts),
            "correct_attempts": correct,
            "overall_accuracy": round(overall, 1),
            "languages_practiced": len(languages),
            "total_languages": 5,
            "characters_practiced": len(characters),
            "first_three_average": round(before, 1),
            "latest_three_average": round(after, 1),
            "before_after_change": round(change, 1),
            "recent_accuracy_trend": round(trend, 1),
        },
        "weakest_characters": weakest,
        "strongest_characters": strongest,
    }


@app.route("/personalized-summary", methods=["GET"])
def get_personalized_summary():
    """Return a personalized AI-style learning summary based on practice history."""
    current_user = _current_user()
    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your personalized learning summary."
        }), 401

    try:
        result = _build_personalized_ai_summary(current_user)
        return jsonify({
            "success": True,
            "message": "Personalized learning summary calculated successfully.",
            "user": current_user,
            **result,
        })
    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to calculate personalized summary: {error}"
        }), 500


@app.route("/ai-summary", methods=["GET"])
def get_ai_summary_alias():
    """Compatibility alias for the personalized learning summary."""
    return get_personalized_summary()


# ============================================================
# PROGRESS / DASHBOARD ANALYTICS
# ============================================================

def _load_user_attempts(user_id, limit=1000):
    """Load practice attempts belonging only to the logged-in user."""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row

    rows = conn.execute("""
        SELECT id, language, character, recognized, confidence, accuracy,
               is_correct, stroke_count, stroke_analysis, mistake_analysis,
               feedback, created_at
        FROM attempts
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (user_id, limit)).fetchall()

    conn.close()

    attempts = []

    for row in rows:
        item = dict(row)

        for key in ("stroke_analysis", "mistake_analysis"):
            if item.get(key):
                try:
                    item[key] = json.loads(item[key])
                except (TypeError, ValueError, json.JSONDecodeError):
                    pass

        item["is_correct"] = bool(item.get("is_correct"))
        attempts.append(item)

    return attempts


def _calculate_streaks(attempts):
    """
    Calculate practice streaks from actual calendar dates.

    Rules:
    - Multiple attempts on the same day count as one practice day.
    - The current streak exists only when the user practiced today.
    - Missing one calendar day resets the current streak.
    - The next day the user practices starts a new streak at 1.
    - The best streak is preserved permanently from the available history.
    """
    practice_dates = set()

    for attempt in attempts:
        created_at = attempt.get("created_at")
        if not created_at:
            continue

        try:
            date_part = str(created_at)[:10]
            practice_date = datetime.strptime(
                date_part,
                "%Y-%m-%d"
            ).date()
            practice_dates.add(practice_date)
        except (TypeError, ValueError):
            continue

    if not practice_dates:
        return {
            "current_streak": 0,
            "best_streak": 0,
            "practice_days": 0,
            "last_practice_date": None,
            "practiced_today": False,
        }

    sorted_dates = sorted(practice_dates)

    # --------------------------------------------------------
    # BEST STREAK
    # --------------------------------------------------------
    best_streak = 1
    running_streak = 1

    for index in range(1, len(sorted_dates)):
        difference = (
            sorted_dates[index] - sorted_dates[index - 1]
        ).days

        if difference == 1:
            running_streak += 1
        else:
            running_streak = 1

        best_streak = max(
            best_streak,
            running_streak
        )

    # --------------------------------------------------------
    # CURRENT STREAK
    # --------------------------------------------------------
    today = datetime.now().date()
    practiced_today = today in practice_dates

    # IMPORTANT:
    # If today is missed, current streak is 0.
    # Practicing tomorrow starts a new streak at 1.
    if not practiced_today:
        current_streak = 0
    else:
        current_streak = 1
        check_date = today

        while True:
            previous_date = check_date - timedelta(days=1)

            if previous_date in practice_dates:
                current_streak += 1
                check_date = previous_date
            else:
                break

    return {
        "current_streak": current_streak,
        "best_streak": best_streak,
        "practice_days": len(practice_dates),
        "last_practice_date": sorted_dates[-1].isoformat(),
        "practiced_today": practiced_today,
    }


@app.route("/streak", methods=["GET"])
def get_streak():
    """Return the logged-in user's actual practice streak."""
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your streak."
        }), 401

    try:
        # Use a large limit so streak history is not cut off at the
        # normal practice-history limit.
        attempts = _load_user_attempts(
            current_user["id"],
            limit=10000
        )

        practice_streak = _calculate_streaks(attempts)
        login_streak = _calculate_login_streaks(current_user["id"])

        return jsonify({
            "success": True,
            "message": "Login streak calculated successfully.",
            "streak": login_streak,
            "login_streak": login_streak,
            "practice_streak": practice_streak,
            "user": current_user
        })

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": f"Unable to calculate streak: {error}"
        }), 500



# ============================================================
# FEATURE #8 — ACHIEVEMENT / BADGE SYSTEM
# ============================================================

def _build_achievements(current_user):
    """Build achievement badges from the user's real practice history."""
    attempts = _load_user_attempts(
        current_user["id"],
        limit=10000
    )

    total_attempts = len(attempts)

    accuracy_values = []
    practiced_languages = set()
    character_attempts = {}

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")),
            str(attempt.get("language", ""))
        )
        character = str(attempt.get("character", ""))

        if language:
            practiced_languages.add(language)

        accuracy = attempt.get("accuracy")
        try:
            if accuracy is not None:
                accuracy_values.append(
                    max(0.0, min(100.0, float(accuracy)))
                )
        except (TypeError, ValueError):
            pass

        key = (language, character)
        character_attempts.setdefault(key, [])

        try:
            if accuracy is not None:
                character_attempts[key].append(
                    max(0.0, min(100.0, float(accuracy)))
                )
        except (TypeError, ValueError):
            pass

    overall_accuracy = (
        sum(accuracy_values) / len(accuracy_values)
        if accuracy_values else 0.0
    )

    streaks = _calculate_streaks(attempts)

    # --------------------------------------------------------
    # Character Master
    # At least 5 attempts on one character and average accuracy
    # of at least 90%.
    # --------------------------------------------------------
    character_master = False
    character_master_details = None

    for (language, character), values in character_attempts.items():
        if len(values) >= 5:
            character_accuracy = sum(values) / len(values)

            if character_accuracy >= 90:
                character_master = True
                character_master_details = {
                    "language": language,
                    "character": character,
                    "attempts": len(values),
                    "accuracy": round(character_accuracy, 1),
                }
                break

    achievements = [
        {
            "id": "first-step",
            "name": "First Step",
            "description": "Complete your first handwriting practice.",
            "icon": "🏁",
            "category": "Practice",
            "requirement": 1,
            "progress": min(total_attempts, 1),
            "unlocked": total_attempts >= 1,
        },
        {
            "id": "practice-starter",
            "name": "Practice Starter",
            "description": "Complete 10 handwriting practice attempts.",
            "icon": "✍️",
            "category": "Practice",
            "requirement": 10,
            "progress": min(total_attempts, 10),
            "unlocked": total_attempts >= 10,
        },
        {
            "id": "dedicated-learner",
            "name": "Dedicated Learner",
            "description": "Complete 50 handwriting practice attempts.",
            "icon": "🌟",
            "category": "Practice",
            "requirement": 50,
            "progress": min(total_attempts, 50),
            "unlocked": total_attempts >= 50,
        },
        {
            "id": "three-day-streak",
            "name": "3-Day Streak",
            "description": "Practice on 3 consecutive days.",
            "icon": "🔥",
            "category": "Streak",
            "requirement": 3,
            "progress": min(streaks["best_streak"], 3),
            "unlocked": streaks["best_streak"] >= 3,
        },
        {
            "id": "seven-day-streak",
            "name": "7-Day Streak",
            "description": "Practice on 7 consecutive days.",
            "icon": "🔥",
            "category": "Streak",
            "requirement": 7,
            "progress": min(streaks["best_streak"], 7),
            "unlocked": streaks["best_streak"] >= 7,
        },
        {
            "id": "accuracy-80",
            "name": "80% Accuracy",
            "description": "Reach an overall practice accuracy of at least 80%.",
            "icon": "🎯",
            "category": "Accuracy",
            "requirement": 80,
            "progress": round(min(overall_accuracy, 80), 1),
            "current_value": round(overall_accuracy, 1),
            "unlocked": overall_accuracy >= 80,
        },
        {
            "id": "accuracy-90",
            "name": "90% Accuracy",
            "description": "Reach an overall practice accuracy of at least 90%.",
            "icon": "🎯",
            "category": "Accuracy",
            "requirement": 90,
            "progress": round(min(overall_accuracy, 90), 1),
            "current_value": round(overall_accuracy, 1),
            "unlocked": overall_accuracy >= 90,
        },
        {
            "id": "language-explorer",
            "name": "Language Explorer",
            "description": "Practice characters from all 5 supported languages.",
            "icon": "🌍",
            "category": "Languages",
            "requirement": 5,
            "progress": min(
                len(
                    practiced_languages.intersection(
                        set(LANGUAGE_CONFIG.keys())
                    )
                ),
                5
            ),
            "unlocked": len(
                practiced_languages.intersection(
                    set(LANGUAGE_CONFIG.keys())
                )
            ) >= 5,
        },
        {
            "id": "character-master",
            "name": "Character Master",
            "description": "Reach at least 90% average accuracy on a character after 5 or more attempts.",
            "icon": "⭐",
            "category": "Mastery",
            "requirement": 90,
            "progress": (
                character_master_details["accuracy"]
                if character_master_details
                else 0
            ),
            "unlocked": character_master,
            "details": character_master_details,
        },
    ]

    unlocked_count = sum(
        1 for achievement in achievements
        if achievement["unlocked"]
    )

    return {
        "achievements": achievements,
        "summary": {
            "total": len(achievements),
            "unlocked": unlocked_count,
            "locked": len(achievements) - unlocked_count,
            "total_attempts": total_attempts,
            "overall_accuracy": round(overall_accuracy, 1),
            "current_streak": streaks["current_streak"],
            "best_streak": streaks["best_streak"],
            "practiced_languages": len(
                practiced_languages.intersection(
                    set(LANGUAGE_CONFIG.keys())
                )
            ),
        },
    }


@app.route("/achievements", methods=["GET"])
def get_achievements():
    """Return achievements calculated from the logged-in user's history."""
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view achievements."
        }), 401

    try:
        result = _build_achievements(current_user)

        return jsonify({
            "success": True,
            "message": "Achievements calculated successfully.",
            "user": current_user,
            **result,
        })

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": f"Unable to load achievements: {error}"
        }), 500


# ============================================================
# FEATURE #9 — POINTS / LEARNING SCORE
# ============================================================

def _build_learning_score(current_user):
    """Calculate gamification points and a 0-100 learning score.

    Points are based only on the user's real practice history.
    Learning score combines accuracy, practice volume, language
    coverage, and consistency without replacing the detailed metrics.
    """
    attempts = _load_user_attempts(
        current_user["id"],
        limit=10000
    )

    total_attempts = len(attempts)
    accuracy_values = []
    practiced_languages = set()
    practice_dates = set()
    correct_attempts = 0

    total_points = 0

    for attempt in attempts:
        # --------------------------------------------------------
        # Accuracy
        # --------------------------------------------------------
        accuracy = attempt.get("accuracy")
        numeric_accuracy = None

        try:
            if accuracy is not None:
                numeric_accuracy = max(
                    0.0,
                    min(100.0, float(accuracy))
                )
                accuracy_values.append(numeric_accuracy)
        except (TypeError, ValueError):
            numeric_accuracy = None

        # --------------------------------------------------------
        # Languages practiced
        # --------------------------------------------------------
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language in LANGUAGE_CONFIG:
            practiced_languages.add(language)

        # --------------------------------------------------------
        # Practice days
        # --------------------------------------------------------
        created_at = attempt.get("created_at")
        if created_at:
            try:
                practice_dates.add(
                    datetime.strptime(
                        str(created_at)[:10],
                        "%Y-%m-%d"
                    ).date()
                )
            except (ValueError, TypeError):
                pass

        # --------------------------------------------------------
        # Attempt points
        #
        # Base:       10 points
        # Accuracy:   0-10 points
        # Correct:     5 points
        # --------------------------------------------------------
        attempt_points = 10

        if numeric_accuracy is not None:
            attempt_points += int(
                round(numeric_accuracy / 10.0)
            )

        is_correct = bool(
            attempt.get("is_correct", False)
        )

        if is_correct:
            attempt_points += 5
            correct_attempts += 1

        total_points += attempt_points

    # ------------------------------------------------------------
    # Accuracy score: directly reflects actual average accuracy.
    # ------------------------------------------------------------
    overall_accuracy = (
        sum(accuracy_values) / len(accuracy_values)
        if accuracy_values
        else 0.0
    )

    # ------------------------------------------------------------
    # Practice score: reaches 100 after 100 attempts.
    # ------------------------------------------------------------
    practice_score = min(
        100.0,
        (total_attempts / 100.0) * 100.0
    )

    # ------------------------------------------------------------
    # Language score: all five supported languages.
    # ------------------------------------------------------------
    language_score = min(
        100.0,
        (len(practiced_languages) / len(LANGUAGE_CONFIG)) * 100.0
    ) if LANGUAGE_CONFIG else 0.0

    # ------------------------------------------------------------
    # Consistency score: reaches 100 after 30 distinct days.
    # ------------------------------------------------------------
    consistency_score = min(
        100.0,
        (len(practice_dates) / 30.0) * 100.0
    )

    streaks = _calculate_streaks(attempts)

    # ------------------------------------------------------------
    # Streak score: 30 consecutive days gives 100.
    # ------------------------------------------------------------
    streak_score = min(
        100.0,
        (streaks["best_streak"] / 30.0) * 100.0
    )

    # ------------------------------------------------------------
    # Overall learning score.
    # Accuracy has the highest weight because this is a handwriting
    # learning application. The remaining components reward sustained
    # practice and exploration.
    # ------------------------------------------------------------
    learning_score = (
        (overall_accuracy * 0.50) +
        (practice_score * 0.20) +
        (language_score * 0.10) +
        (consistency_score * 0.10) +
        (streak_score * 0.10)
    )

    learning_score = round(
        max(0.0, min(100.0, learning_score)),
        1
    )

    # ------------------------------------------------------------
    # Level based on learning score.
    # ------------------------------------------------------------
    if learning_score < 20:
        level = 1
        level_name = "Beginner"
    elif learning_score < 40:
        level = 2
        level_name = "Learner"
    elif learning_score < 60:
        level = 3
        level_name = "Improving"
    elif learning_score < 80:
        level = 4
        level_name = "Skilled"
    else:
        level = 5
        level_name = "Advanced"

    # ------------------------------------------------------------
    # Next level target.
    # ------------------------------------------------------------
    level_thresholds = {
        1: 20,
        2: 40,
        3: 60,
        4: 80,
        5: 100,
    }

    next_level_score = level_thresholds[level]

    if level < 5:
        points_to_next_level = max(
            0,
            int(round((next_level_score - learning_score) * 10))
        )
    else:
        points_to_next_level = 0

    return {
        "points": {
            "total": total_points,
            "earned_from_attempts": total_points,
            "correct_attempts": correct_attempts,
        },
        "learning_score": {
            "score": learning_score,
            "level": level,
            "level_name": level_name,
            "next_level_score": next_level_score,
            "points_to_next_level": points_to_next_level,
        },
        "metrics": {
            "total_attempts": total_attempts,
            "overall_accuracy": round(overall_accuracy, 1),
            "practice_days": len(practice_dates),
            "languages_practiced": len(practiced_languages),
            "total_languages": len(LANGUAGE_CONFIG),
            "current_streak": streaks["current_streak"],
            "best_streak": streaks["best_streak"],
        },
    }


@app.route("/learning-score", methods=["GET"])
def get_learning_score():
    """Return points and learning score for the logged-in user."""
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your learning score."
        }), 401

    try:
        result = _build_learning_score(current_user)

        return jsonify({
            "success": True,
            "message": "Learning score calculated successfully.",
            "user": current_user,
            **result,
        })

    except Exception as error:
        traceback.print_exc()

        return jsonify({
            "success": False,
            "message": f"Unable to calculate learning score: {error}"
        }), 500


def _build_progress_response(current_user):
    """Build user-specific language and character progress."""
    attempts = _load_user_attempts(current_user["id"])

    languages = {}

    for language in LANGUAGE_CONFIG:
        practice_characters = [
            str(character)
            for character in get_practice_characters(language)
        ]

        # Keep the configured character list unique and ordered.
        practice_characters = list(dict.fromkeys(practice_characters))

        # Create a bucket for every character, including characters
        # the user has never practiced.
        characters = {}

        for character in practice_characters:
            characters[character] = {
                "character": character,
                "accuracy": 0,
                "attempts": 0,
                "feedback": [],
                "history": [],
                "practiced": False,
            }

        language_attempts = []

        for attempt in attempts:
            attempt_language = LANGUAGE_ALIASES.get(
                str(attempt.get("language", "")).strip(),
                str(attempt.get("language", "")).strip()
            )

            if attempt_language != language:
                continue

            language_attempts.append(attempt)

            character = normalize_target_character(
                language,
                attempt.get("character", "")
            )
            character = str(character)

            # A valid language character gets its own progress bucket.
            # If an older database contains a label not currently in the
            # configured list, keep it visible in history but do not let
            # it change the denominator for language progress.
            if character not in characters:
                continue

            entry = characters[character]
            entry["attempts"] += 1
            entry["practiced"] = True

            accuracy = attempt.get("accuracy")

            if accuracy is not None:
                try:
                    numeric_accuracy = max(
                        0.0,
                        min(100.0, float(accuracy))
                    )
                except (TypeError, ValueError):
                    numeric_accuracy = None

                if numeric_accuracy is not None:
                    entry["history"].append({
                        "attempt_id": attempt.get("id"),
                        "accuracy": numeric_accuracy,
                        "feedback": attempt.get("feedback"),
                        "recognized": attempt.get("recognized"),
                        "confidence": attempt.get("confidence"),
                        "created_at": attempt.get("created_at"),
                        "stroke_analysis": attempt.get("stroke_analysis"),
                        "mistake_analysis": attempt.get("mistake_analysis"),
                    })

            if attempt.get("feedback"):
                entry["feedback"].append(attempt.get("feedback"))

        # Character accuracy = average of that character's attempts.
        # Unpracticed characters remain at 0%.
        practiced_characters = 0
        accuracy_sum = 0.0

        for entry in characters.values():
            values = [
                history["accuracy"]
                for history in entry["history"]
                if history.get("accuracy") is not None
            ]

            if values:
                entry["accuracy"] = round(
                    sum(values) / len(values),
                    1
                )

            if entry["practiced"]:
                practiced_characters += 1

            # Every character contributes to language progress.
            # Therefore one perfect character out of 26 gives about 3.8%,
            # not 100%.
            accuracy_sum += float(entry["accuracy"])

        total_characters = len(practice_characters)

        if total_characters:
            language_progress = round(
                accuracy_sum / total_characters,
                1
            )
        else:
            language_progress = 0

        languages[language] = {
            "progress": language_progress,
            "attempts": len(language_attempts),
            "characters_practiced": practiced_characters,
            "total_characters": total_characters,
            "characters": characters,
        }

    practice_streaks = _calculate_streaks(attempts)
    login_streaks = _calculate_login_streaks(current_user["id"])

    accuracy_values = []
    for attempt in attempts:
        if attempt.get("accuracy") is not None:
            try:
                accuracy_values.append(
                    max(0.0, min(100.0, float(attempt["accuracy"])))
                )
            except (TypeError, ValueError):
                pass

    overall_accuracy = round(
        sum(accuracy_values) / len(accuracy_values),
        1
    ) if accuracy_values else 0

    practiced_languages = sum(
        1
        for data in languages.values()
        if data["characters_practiced"] > 0
    )

    return {
        "success": True,
        "user": current_user,
        "languages": languages,
        "attempts": attempts,
        "summary": {
            "total_attempts": len(attempts),
            "overall_accuracy": overall_accuracy,
            "practiced_languages": practiced_languages,
            # Existing dashboard fields now represent the login streak.
            "current_streak": login_streaks["current_streak"],
            "best_streak": login_streaks["best_streak"],
            "practice_days": practice_streaks["practice_days"],
            "login_days": login_streaks["login_days"],
            "login_streak": login_streaks,
            "practice_streak": practice_streaks,
        },
    }


# ============================================================
# PERSONALIZED PRACTICE RECOMMENDATIONS
# ============================================================

def _build_recommendations(current_user, limit=5):
    """
    Generate personalized practice recommendations from the
    logged-in user's own handwriting history.

    Recommendations are based on:
    - Low character accuracy
    - Characters practiced only a few times
    - Recent weak performance
    """

    attempts = _load_user_attempts(current_user["id"], limit=1000)

    if not attempts:
        return {
            "has_data": False,
            "message": "Practice a few characters to receive personalized recommendations.",
            "recommendations": []
        }

    character_data = {}

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language not in LANGUAGE_CONFIG:
            continue

        character = normalize_target_character(
            language,
            attempt.get("character", "")
        )

        character = str(character).strip()

        if not character:
            continue

        key = (language, character)

        if key not in character_data:
            character_data[key] = {
                "language": language,
                "character": character,
                "accuracies": [],
                "attempts": 0,
                "recent_accuracy": None,
                "latest_feedback": None,
                "latest_created_at": None,
            }

        entry = character_data[key]
        entry["attempts"] += 1

        accuracy = attempt.get("accuracy")

        if accuracy is not None:
            try:
                accuracy = max(0.0, min(100.0, float(accuracy)))
                entry["accuracies"].append(accuracy)
            except (TypeError, ValueError):
                pass

        # _load_user_attempts returns newest first.
        # Therefore the first valid accuracy is the latest one.
        if entry["recent_accuracy"] is None and accuracy is not None:
            entry["recent_accuracy"] = accuracy
            entry["latest_feedback"] = attempt.get("feedback")
            entry["latest_created_at"] = attempt.get("created_at")

    recommendations = []

    for entry in character_data.values():
        accuracies = entry["accuracies"]
        if not accuracies:
            continue

        average_accuracy = sum(accuracies) / len(accuracies)
        recent_accuracy = entry["recent_accuracy"]
        if recent_accuracy is None:
            recent_accuracy = average_accuracy

        priority = 0
        reasons = []

        if average_accuracy < 50:
            priority += 50
            reasons.append("Your accuracy is currently low.")
        elif average_accuracy < 70:
            priority += 30
            reasons.append("Your accuracy can be improved.")
        elif average_accuracy < 80:
            priority += 15

        if recent_accuracy < 50:
            priority += 30
            reasons.append("Your recent attempt needs more practice.")
        elif recent_accuracy < 70:
            priority += 15

        if entry["attempts"] == 1:
            priority += 20
            reasons.append("You have practiced this character only once.")
        elif entry["attempts"] < 3:
            priority += 10
            reasons.append("More practice will help build consistency.")

        if len(accuracies) >= 2:
            oldest = accuracies[-1]
            latest = accuracies[0]
            improvement = latest - oldest
            if improvement < 0:
                priority += 15
                reasons.append("Your recent accuracy has dropped.")

        if priority <= 0:
            continue

        if average_accuracy < 50:
            recommendation = "High priority practice"
        elif average_accuracy < 70:
            recommendation = "Focus practice"
        else:
            recommendation = "Keep practicing"

        recommendations.append({
            "language": entry["language"],
            "character": entry["character"],
            "average_accuracy": round(average_accuracy, 1),
            "recent_accuracy": round(recent_accuracy, 1),
            "attempts": entry["attempts"],
            "priority": priority,
            "recommendation": recommendation,
            "reason": " ".join(reasons) if reasons else "Continue practicing for better consistency.",
            "feedback": entry["latest_feedback"],
            "last_practiced": entry["latest_created_at"],
        })

    recommendations.sort(
        key=lambda item: (-item["priority"], item["average_accuracy"])
    )
    recommendations = recommendations[:limit]

    return {
        "has_data": True,
        "message": "These recommendations are based on your practice history.",
        "recommendations": recommendations
    }


@app.route("/recommendations", methods=["GET"])
def get_recommendations():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view recommendations."
        }), 401

    try:
        try:
            limit = int(request.args.get("limit", 5))
        except (TypeError, ValueError):
            limit = 5

        limit = max(1, min(limit, 10))

        recommendation_data = _build_recommendations(current_user, limit)

        return jsonify({
            "success": True,
            "user": current_user,
            **recommendation_data
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to generate recommendations: {error}"
        }), 500


# ============================================================
# WEAK CHARACTER DETECTION
# ============================================================

def _build_weak_characters(current_user, limit=10):
    """
    Detect characters that need additional practice for the
    logged-in user.

    Only the user's own saved practice attempts are considered.
    A character can be identified as weak when it has:
    - Low average accuracy
    - Low recent accuracy
    - Inconsistent accuracy across attempts
    - A recent decline in performance

    Unpracticed characters are not classified as weak because
    there is not enough user-specific performance data yet.
    """

    attempts = _load_user_attempts(current_user["id"], limit=1000)

    if not attempts:
        return {
            "has_data": False,
            "message": "Practice characters to identify your weak areas.",
            "weak_characters": []
        }

    character_data = {}

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language not in LANGUAGE_CONFIG:
            continue

        character = normalize_target_character(
            language,
            attempt.get("character", "")
        )
        character = str(character).strip()

        if not character:
            continue

        key = (language, character)

        if key not in character_data:
            character_data[key] = {
                "language": language,
                "character": character,
                "accuracies": [],
                "attempts": 0,
                "latest_accuracy": None,
                "latest_feedback": None,
                "latest_created_at": None,
            }

        entry = character_data[key]
        entry["attempts"] += 1

        accuracy = attempt.get("accuracy")

        try:
            if accuracy is None:
                continue
            accuracy = max(0.0, min(100.0, float(accuracy)))
        except (TypeError, ValueError):
            continue

        entry["accuracies"].append(accuracy)

        # Attempts are returned newest first, so the first valid
        # accuracy is the most recent one.
        if entry["latest_accuracy"] is None:
            entry["latest_accuracy"] = accuracy
            entry["latest_feedback"] = attempt.get("feedback")
            entry["latest_created_at"] = attempt.get("created_at")

    weak_characters = []

    for entry in character_data.values():
        accuracies = entry["accuracies"]

        if not accuracies:
            continue

        average_accuracy = sum(accuracies) / len(accuracies)
        latest_accuracy = entry["latest_accuracy"]
        if latest_accuracy is None:
            latest_accuracy = average_accuracy

        # Standard deviation is used as a simple consistency measure.
        consistency = float(np.std(accuracies)) if len(accuracies) > 1 else 0.0

        # Positive weakness score means the character needs attention.
        weakness_score = 0.0
        reasons = []

        if average_accuracy < 50:
            weakness_score += 60
            reasons.append("Your average accuracy is very low.")
        elif average_accuracy < 70:
            weakness_score += 40
            reasons.append("Your average accuracy needs improvement.")
        elif average_accuracy < 80:
            weakness_score += 20
            reasons.append("Your accuracy can still be improved.")

        if latest_accuracy < 50:
            weakness_score += 30
            reasons.append("Your latest attempt was weak.")
        elif latest_accuracy < 70:
            weakness_score += 20
            reasons.append("Your latest attempt needs more practice.")

        if len(accuracies) >= 2:
            oldest_accuracy = accuracies[-1]
            change = latest_accuracy - oldest_accuracy

            if change <= -15:
                weakness_score += 25
                reasons.append("Your recent accuracy has dropped.")
            elif change <= -5:
                weakness_score += 10
                reasons.append("Your recent accuracy has decreased.")

            if consistency >= 20:
                weakness_score += 15
                reasons.append("Your performance is inconsistent.")

        # A single attempt with low accuracy is still useful evidence,
        # but a single high-accuracy attempt is not called weak.
        if entry["attempts"] == 1 and average_accuracy < 70:
            weakness_score += 10

        if weakness_score <= 0:
            continue

        if average_accuracy < 50:
            severity = "High"
        elif average_accuracy < 70:
            severity = "Medium"
        else:
            severity = "Needs consistency"

        weak_characters.append({
            "language": entry["language"],
            "character": entry["character"],
            "average_accuracy": round(average_accuracy, 1),
            "latest_accuracy": round(latest_accuracy, 1),
            "attempts": entry["attempts"],
            "consistency_score": round(max(0.0, 100.0 - consistency), 1),
            "weakness_score": round(weakness_score, 1),
            "severity": severity,
            "reason": " ".join(reasons),
            "feedback": entry["latest_feedback"],
            "last_practiced": entry["latest_created_at"],
        })

    weak_characters.sort(
        key=lambda item: (-item["weakness_score"], item["average_accuracy"])
    )

    weak_characters = weak_characters[:limit]

    return {
        "has_data": True,
        "message": (
            "These weak characters are identified from your practice "
            "accuracy and recent performance."
        ),
        "weak_characters": weak_characters
    }


@app.route("/weak-characters", methods=["GET"])
def get_weak_characters():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view weak characters."
        }), 401

    try:
        try:
            limit = int(request.args.get("limit", 10))
        except (TypeError, ValueError):
            limit = 10

        limit = max(1, min(limit, 20))

        weak_data = _build_weak_characters(
            current_user,
            limit
        )

        return jsonify({
            "success": True,
            "user": current_user,
            **weak_data
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to detect weak characters: {error}"
        }), 500


# ============================================================
# ADAPTIVE DIFFICULTY
# ============================================================

def _build_adaptive_difficulty(current_user, limit=20):
    """
    Determine a personalized practice difficulty for each character
    from the logged-in user's own handwriting history.

    Difficulty is based on the user's performance:
    - Below 50%  -> Easy
    - 50-69.9%   -> Medium
    - 70-84.9%   -> Hard
    - 85%+       -> Advanced

    Recent performance and accuracy trend are also considered so a
    character can become easier when the user is struggling or harder
    when the user is consistently improving.
    """

    attempts = _load_user_attempts(current_user["id"], limit=1000)

    if not attempts:
        return {
            "has_data": False,
            "message": "Practice characters to unlock adaptive difficulty.",
            "adaptive_difficulty": []
        }

    character_data = {}

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language not in LANGUAGE_CONFIG:
            continue

        character = normalize_target_character(
            language,
            attempt.get("character", "")
        )
        character = str(character).strip()

        if not character:
            continue

        key = (language, character)

        if key not in character_data:
            character_data[key] = {
                "language": language,
                "character": character,
                "accuracies": [],
                "attempts": 0,
                "latest_accuracy": None,
                "latest_feedback": None,
                "latest_created_at": None,
            }

        entry = character_data[key]
        entry["attempts"] += 1

        accuracy = attempt.get("accuracy")

        try:
            if accuracy is None:
                continue
            accuracy = max(0.0, min(100.0, float(accuracy)))
        except (TypeError, ValueError):
            continue

        entry["accuracies"].append(accuracy)

        # Attempts are newest first.
        if entry["latest_accuracy"] is None:
            entry["latest_accuracy"] = accuracy
            entry["latest_feedback"] = attempt.get("feedback")
            entry["latest_created_at"] = attempt.get("created_at")

    adaptive = []

    for entry in character_data.values():
        accuracies = entry["accuracies"]
        if not accuracies:
            continue

        average_accuracy = sum(accuracies) / len(accuracies)
        latest_accuracy = entry["latest_accuracy"]
        if latest_accuracy is None:
            latest_accuracy = average_accuracy

        # A weighted score gives the latest performance more importance.
        # For one attempt this simply equals the attempt accuracy.
        if len(accuracies) >= 2:
            recent_values = accuracies[:3]
            recent_average = sum(recent_values) / len(recent_values)
            performance_score = (average_accuracy * 0.4) + (recent_average * 0.6)
            trend = latest_accuracy - accuracies[-1]
        else:
            performance_score = average_accuracy
            trend = 0.0

        # Base difficulty from the user's current performance.
        if performance_score < 50:
            difficulty = "Easy"
            level = 1
            guidance = "Use guided practice with more feedback and repetition."
        elif performance_score < 70:
            difficulty = "Medium"
            level = 2
            guidance = "Use normal practice with focused feedback."
        elif performance_score < 85:
            difficulty = "Hard"
            level = 3
            guidance = "Use reduced guidance and focus on writing independently."
        else:
            difficulty = "Advanced"
            level = 4
            guidance = "Use challenge-level practice to maintain accuracy."

        # Adapt one level based on a meaningful recent trend.
        # This prevents a single small fluctuation from changing difficulty.
        if trend <= -15 and level > 1:
            level -= 1
            difficulty = {
                1: "Easy",
                2: "Medium",
                3: "Hard",
                4: "Advanced"
            }[level]
            guidance = "Your recent accuracy dropped, so practice with additional guidance."
        elif trend >= 15 and level < 4 and len(accuracies) >= 2:
            level += 1
            difficulty = {
                1: "Easy",
                2: "Medium",
                3: "Hard",
                4: "Advanced"
            }[level]
            guidance = "Your recent accuracy improved, so try a slightly more challenging practice level."

        if average_accuracy < 50:
            reason = "Your current performance is low, so the practice difficulty is reduced."
        elif average_accuracy < 70:
            reason = "Your accuracy is developing, so normal guided practice is recommended."
        elif average_accuracy < 85:
            reason = "Your accuracy is good, so the system increases the challenge."
        else:
            reason = "Your accuracy is strong, so the system uses advanced practice."

        if trend <= -15:
            reason += " Recent performance has decreased."
        elif trend >= 15:
            reason += " Recent performance has improved."

        adaptive.append({
            "language": entry["language"],
            "character": entry["character"],
            "difficulty": difficulty,
            "difficulty_level": level,
            "average_accuracy": round(average_accuracy, 1),
            "latest_accuracy": round(latest_accuracy, 1),
            "performance_score": round(performance_score, 1),
            "attempts": entry["attempts"],
            "trend": round(trend, 1),
            "reason": reason,
            "guidance": guidance,
            "feedback": entry["latest_feedback"],
            "last_practiced": entry["latest_created_at"],
        })

    adaptive.sort(
        key=lambda item: (item["difficulty_level"], item["performance_score"])
    )

    return {
        "has_data": True,
        "message": "Difficulty is personalized from your practice performance.",
        "adaptive_difficulty": adaptive[:limit]
    }


@app.route("/adaptive-difficulty", methods=["GET"])
def get_adaptive_difficulty():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view adaptive difficulty."
        }), 401

    try:
        try:
            limit = int(request.args.get("limit", 20))
        except (TypeError, ValueError):
            limit = 20

        limit = max(1, min(limit, 50))

        adaptive_data = _build_adaptive_difficulty(
            current_user,
            limit
        )

        return jsonify({
            "success": True,
            "user": current_user,
            **adaptive_data
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to calculate adaptive difficulty: {error}"
        }), 500



# ============================================================
# RECOMMENDED PRACTICE MODE
# ============================================================

def _build_recommended_practice_modes(current_user, limit=20):
    """
    Recommend the most suitable practice mode for each character
    using the logged-in user's own handwriting performance.

    Modes:
    - Guided Practice: very weak performance
    - Focused Practice: needs improvement
    - Review Practice: recent performance has declined
    - Normal Practice: stable, average performance
    - Challenge Practice: consistently strong performance
    """

    attempts = _load_user_attempts(current_user["id"], limit=1000)

    if not attempts:
        return {
            "has_data": False,
            "message": "Practice a few characters to receive a personalized practice mode.",
            "recommended_modes": []
        }

    character_data = {}

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language not in LANGUAGE_CONFIG:
            continue

        character = normalize_target_character(
            language,
            attempt.get("character", "")
        )
        character = str(character).strip()

        if not character:
            continue

        key = (language, character)

        if key not in character_data:
            character_data[key] = {
                "language": language,
                "character": character,
                "accuracies": [],
                "attempts": 0,
                "latest_accuracy": None,
                "latest_feedback": None,
                "latest_created_at": None,
            }

        entry = character_data[key]
        entry["attempts"] += 1

        accuracy = attempt.get("accuracy")
        try:
            accuracy = max(0.0, min(100.0, float(accuracy)))
        except (TypeError, ValueError):
            accuracy = None

        if accuracy is not None:
            entry["accuracies"].append(accuracy)

            # Attempts are newest first, so first valid value is latest.
            if entry["latest_accuracy"] is None:
                entry["latest_accuracy"] = accuracy
                entry["latest_feedback"] = attempt.get("feedback")
                entry["latest_created_at"] = attempt.get("created_at")

    recommendations = []

    for entry in character_data.values():
        accuracies = entry["accuracies"]
        if not accuracies:
            continue

        average_accuracy = sum(accuracies) / len(accuracies)
        latest_accuracy = entry["latest_accuracy"]
        if latest_accuracy is None:
            latest_accuracy = average_accuracy

        # Compare the newest attempt with the previous average.
        if len(accuracies) >= 2:
            previous_accuracies = accuracies[1:]
            previous_average = sum(previous_accuracies) / len(previous_accuracies)
            trend = latest_accuracy - previous_average
        else:
            trend = 0.0

        # --------------------------------------------------------
        # SELECT PRACTICE MODE
        # --------------------------------------------------------
        if latest_accuracy < 50 or average_accuracy < 50:
            mode = "Guided Practice"
            mode_level = 1
            reason = "Your accuracy is low, so guided practice with more feedback and repetition is recommended."
            focus = "Shape guidance, repetition and immediate AI feedback."

        elif latest_accuracy < 70 or average_accuracy < 70:
            mode = "Focused Practice"
            mode_level = 2
            reason = "Your character needs improvement, so focused practice is recommended."
            focus = "Repeat the character and work on the areas highlighted by AI feedback."

        elif trend < -10:
            mode = "Review Practice"
            mode_level = 2
            reason = "Your recent accuracy has dropped, so review practice is recommended."
            focus = "Review the character carefully and rebuild consistency."

        elif average_accuracy >= 85 and latest_accuracy >= 85:
            mode = "Challenge Practice"
            mode_level = 4
            reason = "Your performance is strong, so challenge practice can help maintain and extend your accuracy."
            focus = "Challenge-level repetition with less guidance."

        else:
            mode = "Normal Practice"
            mode_level = 3
            reason = "Your performance is stable, so normal practice is recommended."
            focus = "Regular practice with standard AI feedback."

        recommendations.append({
            "language": entry["language"],
            "character": entry["character"],
            "attempts": entry["attempts"],
            "average_accuracy": round(average_accuracy, 1),
            "latest_accuracy": round(latest_accuracy, 1),
            "trend": round(trend, 1),
            "practice_mode": mode,
            "mode_level": mode_level,
            "reason": reason,
            "focus": focus,
            "feedback": entry["latest_feedback"],
            "last_practiced": entry["latest_created_at"],
        })

    # Weak characters first, then characters with lower accuracy.
    recommendations.sort(
        key=lambda item: (item["mode_level"], item["average_accuracy"])
    )

    return {
        "has_data": True,
        "message": "Practice mode is personalized from your practice performance.",
        "recommended_modes": recommendations[:limit]
    }


@app.route("/recommended-practice-mode", methods=["GET"])
def get_recommended_practice_mode():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your recommended practice mode."
        }), 401

    try:
        try:
            limit = int(request.args.get("limit", 20))
        except (TypeError, ValueError):
            limit = 20

        limit = max(1, min(limit, 50))

        recommendation_data = _build_recommended_practice_modes(
            current_user,
            limit
        )

        return jsonify({
            "success": True,
            "user": current_user,
            **recommendation_data
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to recommend a practice mode: {error}"
        }), 500

# ============================================================
# FEATURE #5 — PRACTICE CHALLENGES
# ============================================================

def _build_practice_challenges(current_user, limit=5):
    """Build personalized practice challenges from the user's history."""
    attempts = _load_user_attempts(current_user["id"], limit=10000)
    data = {}
    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(str(attempt.get("language", "")).strip(), str(attempt.get("language", "")).strip())
        if language not in LANGUAGE_CONFIG:
            continue
        character = str(normalize_target_character(language, attempt.get("character", ""))).strip()
        if not character:
            continue
        key = (language, character)
        entry = data.setdefault(key, {"language": language, "character": character, "accuracies": [], "attempts": 0, "latest_accuracy": None, "latest_feedback": None})
        entry["attempts"] += 1
        try:
            accuracy = max(0.0, min(100.0, float(attempt.get("accuracy"))))
            entry["accuracies"].append(accuracy)
            if entry["latest_accuracy"] is None:
                entry["latest_accuracy"] = accuracy
                entry["latest_feedback"] = attempt.get("feedback")
        except (TypeError, ValueError):
            pass

    candidates = []
    for entry in data.values():
        if not entry["accuracies"]:
            continue
        avg = sum(entry["accuracies"]) / len(entry["accuracies"])
        latest = entry["latest_accuracy"] if entry["latest_accuracy"] is not None else avg
        priority = 100.0 - avg
        if latest < 50:
            priority += 25
        elif latest < 70:
            priority += 10
        recent = entry["accuracies"][:3]
        recent_avg = sum(recent) / len(recent)
        if latest < recent_avg - 10:
            priority += 15
        candidates.append({**entry, "average_accuracy": round(avg, 1), "latest_accuracy": round(latest, 1), "priority": round(priority, 1)})

    candidates.sort(key=lambda x: (-x["priority"], x["average_accuracy"], x["language"], x["character"]))
    challenges = []
    if candidates:
        weak = candidates[0]
        challenges.append({
            "challenge_id": 1, "challenge_type": "Weak Character Challenge", "title": f"Improve {weak['character']}",
            "language": weak["language"], "character": weak["character"],
            "description": f"Practice {weak['character']} and improve its accuracy.",
            "current_accuracy": weak["average_accuracy"], "latest_accuracy": weak["latest_accuracy"],
            "attempts": weak["attempts"], "goal_accuracy": 80, "required_attempts": 5,
            "progress": {"completed_attempts": 0, "required_attempts": 5, "goal_accuracy": 80, "current_accuracy": weak["latest_accuracy"], "completed": False},
            "priority": weak["priority"], "focus": "Improve shape and recognition through repeated practice.", "feedback": weak["latest_feedback"]
        })

    recommended = candidates[:5]
    challenges.append({
        "challenge_id": 2, "challenge_type": "Multi-Character Challenge", "title": "Practice 5 Characters",
        "language": "Multiple", "character": None, "description": "Practice five recommended characters to improve overall performance.",
        "attempts": 0, "goal_accuracy": 80, "required_attempts": 5,
        "progress": {"completed_attempts": 0, "required_attempts": 5, "goal_accuracy": 80, "current_accuracy": None, "completed": False},
        "priority": 50 if recommended else 20, "focus": "Build consistency across multiple characters.",
        "recommended_characters": [{"language": x["language"], "character": x["character"], "accuracy": x["average_accuracy"], "priority": x["priority"]} for x in recommended]
    })

    if not candidates:
        challenges = [{"challenge_id": 1, "challenge_type": "Starter Challenge", "title": "Start Practicing", "language": "Multiple", "character": None, "description": "Practice your first characters to start building personalized challenges.", "goal_accuracy": 80, "required_attempts": 5, "progress": {"completed_attempts": 0, "required_attempts": 5, "goal_accuracy": 80, "current_accuracy": None, "completed": False}, "priority": 20, "focus": "Build your practice history.", "recommended_characters": []}]

    return {"has_data": bool(candidates), "challenges": challenges[:limit]}


@app.route("/practice-challenges", methods=["GET"])
def get_practice_challenges():
    current_user = _current_user()
    if not current_user:
        return jsonify({"success": False, "message": "Please log in to view practice challenges."}), 401
    try:
        return jsonify({"success": True, "message": "Practice challenges calculated successfully.", "user": current_user, **_build_practice_challenges(current_user)})
    except Exception as error:
        traceback.print_exc()
        return jsonify({"success": False, "message": f"Unable to load practice challenges: {error}"}), 500


# ============================================================
# DAILY CHALLENGE
# ============================================================

def _build_daily_challenge(current_user):
    """
    Build one stable, personalized challenge for the current day.

    The challenge is selected deterministically from the user's own
    practice history, so refreshing the endpoint on the same day does
    not create a different challenge.

    Priority:
    1. Weakest practiced character
    2. Lowest accuracy character
    3. Multi-character challenge when there is no practice history
    """

    attempts = _load_user_attempts(current_user["id"], limit=1000)

    today = datetime.now().date().isoformat()

    if not attempts:
        return {
            "has_data": False,
            "message": "Practice a character to unlock your personalized daily challenge.",
            "daily_challenge": {
                "challenge_id": f"daily-{current_user['id']}-{today}",
                "date": today,
                "challenge_type": "Starter Challenge",
                "title": "Start Your Practice",
                "language": "Multiple",
                "character": None,
                "goal_accuracy": 80,
                "required_attempts": 3,
                "progress": {
                    "completed_attempts": 0,
                    "current_accuracy": None,
                    "goal_accuracy": 80,
                    "required_attempts": 3,
                    "completed": False,
                },
                "focus": "Practice any character to begin building your personalized learning history.",
                "reason": "There is not enough practice history yet, so a starter challenge is shown.",
                "recommended_characters": [],
            }
        }

    character_data = {}

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )

        if language not in LANGUAGE_CONFIG:
            continue

        character = normalize_target_character(
            language,
            attempt.get("character", "")
        )
        character = str(character).strip()

        if not character:
            continue

        key = (language, character)

        if key not in character_data:
            character_data[key] = {
                "language": language,
                "character": character,
                "accuracies": [],
                "attempts": 0,
                "latest_accuracy": None,
                "latest_feedback": None,
                "latest_created_at": None,
            }

        entry = character_data[key]
        entry["attempts"] += 1

        accuracy = attempt.get("accuracy")
        try:
            if accuracy is None:
                continue
            accuracy = max(0.0, min(100.0, float(accuracy)))
        except (TypeError, ValueError):
            continue

        entry["accuracies"].append(accuracy)

        if entry["latest_accuracy"] is None:
            entry["latest_accuracy"] = accuracy
            entry["latest_feedback"] = attempt.get("feedback")
            entry["latest_created_at"] = attempt.get("created_at")

    candidates = []

    for entry in character_data.values():
        if not entry["accuracies"]:
            continue

        average_accuracy = sum(entry["accuracies"]) / len(entry["accuracies"])
        latest_accuracy = entry["latest_accuracy"]
        if latest_accuracy is None:
            latest_accuracy = average_accuracy

        if len(entry["accuracies"]) >= 2:
            previous = entry["accuracies"][1:]
            previous_average = sum(previous) / len(previous)
            trend = latest_accuracy - previous_average
        else:
            trend = 0.0

        # Lower accuracy and a negative trend receive higher priority.
        priority = (100.0 - average_accuracy)
        if latest_accuracy < 50:
            priority += 25
        elif latest_accuracy < 70:
            priority += 10

        if trend < -10:
            priority += 15

        candidates.append({
            **entry,
            "average_accuracy": average_accuracy,
            "latest_accuracy": latest_accuracy,
            "trend": trend,
            "priority": priority,
        })

    if not candidates:
        return {
            "has_data": False,
            "message": "Practice a character to unlock your personalized daily challenge.",
            "daily_challenge": None
        }

    # Deterministic ordering: same user + same performance produces the
    # same challenge during the day.
    candidates.sort(
        key=lambda item: (
            -item["priority"],
            item["average_accuracy"],
            item["language"],
            item["character"],
        )
    )

    selected = candidates[0]

    # Use a realistic goal based on the current performance.
    if selected["average_accuracy"] < 50:
        goal_accuracy = 80
    elif selected["average_accuracy"] < 70:
        goal_accuracy = 85
    else:
        goal_accuracy = 90

    required_attempts = 5

    # Count today's attempts for the selected character.
    completed_attempts = 0
    today_accuracies = []

    for attempt in attempts:
        language = LANGUAGE_ALIASES.get(
            str(attempt.get("language", "")).strip(),
            str(attempt.get("language", "")).strip()
        )
        if language != selected["language"]:
            continue

        character = normalize_target_character(
            language,
            attempt.get("character", "")
        )
        if str(character).strip() != selected["character"]:
            continue

        created_at = str(attempt.get("created_at") or "")
        if created_at[:10] != today:
            continue

        completed_attempts += 1
        accuracy = attempt.get("accuracy")
        try:
            if accuracy is not None:
                today_accuracies.append(
                    max(0.0, min(100.0, float(accuracy)))
                )
        except (TypeError, ValueError):
            pass

    current_accuracy = (
        sum(today_accuracies) / len(today_accuracies)
        if today_accuracies else selected["average_accuracy"]
    )

    # The daily goal is completed only after the required number of
    # attempts AND the target accuracy have been reached.
    completed = (
        completed_attempts >= required_attempts
        and current_accuracy >= goal_accuracy
    )

    if selected["average_accuracy"] < 50:
        challenge_type = "Weak Character Challenge"
        focus = "Improve the overall shape and recognition of this weak character."
        reason = "This is currently your weakest practiced character, so today's challenge focuses on improvement."
    elif selected["trend"] < -10:
        challenge_type = "Recovery Challenge"
        focus = "Rebuild accuracy and consistency after a recent performance drop."
        reason = "Your recent performance has declined, so today's challenge focuses on recovery."
    elif selected["average_accuracy"] < 70:
        challenge_type = "Accuracy Improvement Challenge"
        focus = "Repeat the character and work toward the target accuracy."
        reason = "Your current accuracy can be improved, so today's challenge targets accuracy growth."
    else:
        challenge_type = "Consistency Challenge"
        focus = "Maintain strong accuracy across repeated attempts."
        reason = "Your performance is already good, so today's challenge focuses on consistency."

    return {
        "has_data": True,
        "message": "Today's challenge is personalized from your practice performance.",
        "daily_challenge": {
            "challenge_id": f"daily-{current_user['id']}-{today}",
            "date": today,
            "challenge_type": challenge_type,
            "title": f"Daily Challenge: Improve {selected['character']}",
            "language": selected["language"],
            "character": selected["character"],
            "current_accuracy": round(selected["average_accuracy"], 1),
            "latest_accuracy": round(selected["latest_accuracy"], 1),
            "trend": round(selected["trend"], 1),
            "attempts": selected["attempts"],
            "goal_accuracy": goal_accuracy,
            "required_attempts": required_attempts,
            "progress": {
                "completed_attempts": min(completed_attempts, required_attempts),
                "current_accuracy": round(current_accuracy, 1),
                "goal_accuracy": goal_accuracy,
                "required_attempts": required_attempts,
                "completed": completed,
            },
            "focus": focus,
            "reason": reason,
            "feedback": selected["latest_feedback"],
            "last_practiced": selected["latest_created_at"],
        }
    }


@app.route("/daily-challenge", methods=["GET"])
def get_daily_challenge():
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view your daily challenge."
        }), 401

    try:
        challenge_data = _build_daily_challenge(current_user)

        return jsonify({
            "success": True,
            "user": current_user,
            **challenge_data
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to generate daily challenge: {error}"
        }), 500


@app.route("/progress", methods=["GET"])
def get_progress():
    """Return dashboard progress for the currently logged-in user."""
    current_user = _current_user()

    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view progress."
        }), 401

    try:
        response = _build_progress_response(current_user)

        requested_language = request.args.get("language")

        if requested_language:
            requested_language = LANGUAGE_ALIASES.get(
                requested_language,
                requested_language
            )

            if requested_language not in response["languages"]:
                return jsonify({
                    "success": False,
                    "message": "Unsupported language."
                }), 400

            response["languages"] = {
                requested_language:
                    response["languages"][requested_language]
            }

        return jsonify(response)

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "message": f"Unable to load progress: {error}"
        }), 500


@app.route("/performance", methods=["GET"])
def get_performance():
    """Compatibility endpoint using the same user-specific progress data."""
    return get_progress()


# ============================================================
# METHOD NOT ALLOWED
# ============================================================

@app.errorhandler(405)
def method_not_allowed(error):

    return jsonify({

        "status":
            "error",

        "message":
            "Method not allowed."

    }), 405


# ============================================================
# SERVER START
# ============================================================



@app.route("/attempts", methods=["GET"])
def get_attempts():
    """Return practice history for the currently logged-in user only."""
    current_user = _current_user()
    if not current_user:
        return jsonify({
            "success": False,
            "message": "Please log in to view practice history."
        }), 401

    try:
        limit = int(request.args.get("limit", 100))
    except (TypeError, ValueError):
        limit = 100
    limit = max(1, min(limit, 200))

    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    rows = conn.execute("""
        SELECT id, language, character, recognized, confidence, accuracy,
               is_correct, stroke_count, stroke_analysis, mistake_analysis,
               feedback, created_at
        FROM attempts
        WHERE user_id = ?
        ORDER BY id DESC
        LIMIT ?
    """, (current_user["id"], limit)).fetchall()
    conn.close()

    attempts = []
    for row in rows:
        item = dict(row)
        for key in ("stroke_analysis", "mistake_analysis"):
            if item[key]:
                try:
                    item[key] = json.loads(item[key])
                except (TypeError, ValueError, json.JSONDecodeError):
                    pass
        item["is_correct"] = bool(item["is_correct"])
        attempts.append(item)

    return jsonify({
        "success": True,
        "attempts": attempts,
        "count": len(attempts)
    })


# ============================================================
# FEATURE #14 — ADVANCED STROKE ORDER VALIDATION
# ============================================================

def _stroke_feedback_for_points(stroke, stroke_number):
    """Return non-reference-based quality feedback for one stroke."""
    if not isinstance(stroke, dict):
        return {
            "stroke_number": stroke_number,
            "status": "invalid",
            "mistakes": ["Invalid stroke data."],
            "feedback": "This stroke could not be analyzed."
        }

    points = stroke.get("points") or stroke.get("path") or []
    if not isinstance(points, list) or len(points) < 2:
        return {
            "stroke_number": stroke_number,
            "status": "insufficient_data",
            "mistakes": ["Not enough points."],
            "feedback": "Draw the stroke with a clear start and end point."
        }

    clean = []
    for point in points:
        if isinstance(point, dict):
            try:
                x = float(point.get("x"))
                y = float(point.get("y"))
                if np.isfinite(x) and np.isfinite(y):
                    clean.append((x, y))
            except (TypeError, ValueError):
                continue
        elif isinstance(point, (list, tuple)) and len(point) >= 2:
            try:
                x, y = float(point[0]), float(point[1])
                if np.isfinite(x) and np.isfinite(y):
                    clean.append((x, y))
            except (TypeError, ValueError):
                continue

    if len(clean) < 2:
        return {
            "stroke_number": stroke_number,
            "status": "insufficient_data",
            "mistakes": ["Not enough valid points."],
            "feedback": "Draw a continuous stroke with enough points for analysis."
        }

    dx = clean[-1][0] - clean[0][0]
    dy = clean[-1][1] - clean[0][1]
    distance = float(np.hypot(dx, dy))

    segment_lengths = [
        float(np.hypot(clean[i][0] - clean[i - 1][0], clean[i][1] - clean[i - 1][1]))
        for i in range(1, len(clean))
    ]
    path_length = sum(segment_lengths)

    mistakes = []
    if path_length <= 0:
        mistakes.append("Stroke has almost no movement.")
    elif distance / path_length < 0.25 and path_length > 20:
        mistakes.append("The stroke changes direction heavily or is too irregular.")

    if len(clean) < 4:
        mistakes.append("Stroke contains very few points; write more continuously.")

    status = "needs_attention" if mistakes else "analyzed"
    if not mistakes:
        feedback = "Stroke movement looks clear."
    else:
        feedback = " ".join(mistakes)

    return {
        "stroke_number": stroke_number,
        "status": status,
        "mistakes": mistakes,
        "feedback": feedback,
        "point_count": len(clean),
        "path_length": round(path_length, 2),
        "start_point": {"x": round(clean[0][0], 2), "y": round(clean[0][1], 2)},
        "end_point": {"x": round(clean[-1][0], 2), "y": round(clean[-1][1], 2)},
        "direction": _stroke_direction({"points": [{"x": x, "y": y} for x, y in clean]})
    }


def _stroke_direction(stroke):
    """Return a coarse writing direction from the first to last point."""
    if not isinstance(stroke, (list, tuple)) or len(stroke) < 2:
        return "unknown"

    def point_xy(point):
        if isinstance(point, dict):
            return float(point.get("x", 0)), float(point.get("y", 0))
        if isinstance(point, (list, tuple)) and len(point) >= 2:
            return float(point[0]), float(point[1])
        return 0.0, 0.0

    try:
        x1, y1 = point_xy(stroke[0])
        x2, y2 = point_xy(stroke[-1])
    except (TypeError, ValueError):
        return "unknown"

    dx = x2 - x1
    dy = y2 - y1
    if abs(dx) < 1e-6 and abs(dy) < 1e-6:
        return "stationary"

    angle = np.degrees(np.arctan2(-dy, dx))
    if angle < 0:
        angle += 360

    directions = [
        ("right", 0), ("up-right", 45), ("up", 90),
        ("up-left", 135), ("left", 180), ("down-left", 225),
        ("down", 270), ("down-right", 315)
    ]
    return min(directions, key=lambda item: abs((angle - item[1] + 180) % 360 - 180))[0]


def _normalize_stroke_directions(value):
    if not isinstance(value, list):
        return []
    return [str(item).strip().lower() for item in value]


@app.route("/validate-stroke-order", methods=["GET", "POST"])
def validate_stroke_order():
    # GET is intentionally supported so opening the endpoint in a browser
    # does not produce a 405. Actual validation is performed with POST.
    if request.method == "GET":
        return jsonify({
            "success": True,
            "status": "ready",
            "message": "Stroke order validation endpoint is ready. Send a POST request with language, character and strokes.",
            "method": "POST",
            "endpoint": "/validate-stroke-order",
            "required_fields": ["language", "character", "strokes"],
            "optional_fields": ["expected_directions"]
        })

    try:
        data = request.get_json(silent=True) or {}
        language = data.get("language")
        character = data.get("character")
        strokes = data.get("strokes")

        if not language or not character:
            return jsonify({
                "success": False,
                "status": "error",
                "message": "Language and character are required."
            }), 400

        if not isinstance(strokes, list) or not strokes:
            return jsonify({
                "success": False,
                "status": "error",
                "message": "strokes must be a non-empty array."
            }), 400

        actual_directions = [_stroke_direction(stroke) for stroke in strokes]
        expected_directions = _normalize_stroke_directions(
            data.get("expected_directions") or data.get("expectedDirections")
        )

        if expected_directions:
            compared = min(len(actual_directions), len(expected_directions))
            correct = sum(
                actual_directions[i] == expected_directions[i]
                for i in range(compared)
            )
            missing = max(0, len(expected_directions) - len(actual_directions))
            extra = max(0, len(actual_directions) - len(expected_directions))
            score = round((correct / len(expected_directions)) * 100, 2) if expected_directions else 0

            stroke_results = []
            for i in range(compared):
                ok = actual_directions[i] == expected_directions[i]
                stroke_results.append({
                    "stroke_number": i + 1,
                    "expected": expected_directions[i],
                    "actual": actual_directions[i],
                    "correct": ok,
                    "feedback": "Correct stroke direction." if ok else f"Try writing this stroke {expected_directions[i]} instead of {actual_directions[i]}."
                })

            for i in range(compared, len(expected_directions)):
                stroke_results.append({
                    "stroke_number": i + 1,
                    "expected": expected_directions[i],
                    "actual": None,
                    "correct": False,
                    "feedback": "This expected stroke appears to be missing."
                })

            for i in range(compared, len(actual_directions)):
                stroke_results.append({
                    "stroke_number": i + 1,
                    "expected": None,
                    "actual": actual_directions[i],
                    "correct": False,
                    "feedback": "This appears to be an extra stroke."
                })

            return jsonify({
                "success": True,
                "status": "validated",
                "message": "Stroke order validated successfully.",
                "language": language,
                "character": character,
                "stroke_count": len(strokes),
                "expected_stroke_count": len(expected_directions),
                "actual_directions": actual_directions,
                "expected_directions": expected_directions,
                "correct_strokes": correct,
                "incorrect_strokes": len(stroke_results) - correct,
                "missing_strokes": missing,
                "extra_strokes": extra,
                "score": score,
                "is_correct": score == 100 and missing == 0 and extra == 0,
                "stroke_results": stroke_results
            })

        return jsonify({
            "success": True,
            "status": "analyzed",
            "message": "Stroke sequence analyzed. Provide expected_directions to validate the order against a reference sequence.",
            "language": language,
            "character": character,
            "stroke_count": len(strokes),
            "actual_directions": actual_directions,
            "has_reference": False,
            "stroke_order_score": None,
            "stroke_results": []
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "status": "error",
            "message": f"Unable to validate stroke order: {error}"
        }), 500


@app.route("/stroke-order-validation", methods=["GET", "POST"])
def stroke_order_validation_alias():
    return validate_stroke_order()



# ============================================================
# FEATURE #15 - STROKE-BY-STROKE MISTAKE FEEDBACK
# ============================================================

@app.route("/stroke-feedback", methods=["GET", "POST"])
def stroke_feedback():
    if request.method == "GET":
        return jsonify({
            "success": True,
            "status": "ready",
            "message": "Stroke-by-stroke mistake feedback endpoint is ready. Send a POST request with language, character and strokes.",
            "method": "POST",
            "endpoint": "/stroke-feedback",
            "required_fields": ["language", "character", "strokes"],
            "optional_fields": ["expected_directions", "expectedDirections"]
        })

    try:
        data = request.get_json(silent=True) or {}
        language = data.get("language")
        character = data.get("character")
        strokes = data.get("strokes")

        if not language or not character:
            return jsonify({
                "success": False,
                "status": "error",
                "message": "Language and character are required."
            }), 400

        if not isinstance(strokes, list) or not strokes:
            return jsonify({
                "success": False,
                "status": "error",
                "message": "strokes must be a non-empty array."
            }), 400

        # First perform the same directional analysis used by Feature #14.
        actual_directions = [_stroke_direction(stroke) for stroke in strokes]
        expected_directions = _normalize_stroke_directions(
            data.get("expected_directions") or data.get("expectedDirections")
        )

        feedback_items = []
        for index, stroke in enumerate(strokes):
            item = _stroke_feedback_for_points(stroke, index + 1)
            feedback_items.append(item)

        # If a reference sequence is supplied, add exact stroke-order mistakes.
        reference_mistakes = 0
        missing_strokes = 0
        extra_strokes = 0
        order_score = None

        if expected_directions:
            compared = min(len(actual_directions), len(expected_directions))
            for i in range(compared):
                if actual_directions[i] != expected_directions[i]:
                    reference_mistakes += 1
                    feedback_items[i]["status"] = "incorrect"
                    feedback_items[i]["expected_direction"] = expected_directions[i]
                    feedback_items[i]["actual_direction"] = actual_directions[i]
                    feedback_items[i]["mistakes"].append(
                        f"Expected {expected_directions[i]} direction but detected {actual_directions[i]}."
                    )
                    feedback_items[i]["feedback"] = " ".join(feedback_items[i]["mistakes"])
                else:
                    feedback_items[i]["expected_direction"] = expected_directions[i]
                    feedback_items[i]["actual_direction"] = actual_directions[i]

            missing_strokes = max(0, len(expected_directions) - len(actual_directions))
            extra_strokes = max(0, len(actual_directions) - len(expected_directions))
            reference_mistakes += missing_strokes + extra_strokes
            order_score = round((max(0, len(expected_directions) - reference_mistakes) / len(expected_directions)) * 100, 2)

            for i in range(compared, len(expected_directions)):
                feedback_items.append({
                    "stroke_number": i + 1,
                    "status": "missing",
                    "mistakes": ["Expected stroke was not detected."],
                    "feedback": f"Add stroke {i + 1} in the {expected_directions[i]} direction.",
                    "expected_direction": expected_directions[i],
                    "actual_direction": None
                })

            for i in range(compared, len(actual_directions)):
                feedback_items[i]["status"] = "extra"
                feedback_items[i]["mistakes"].append("This stroke is not present in the reference sequence.")
                feedback_items[i]["feedback"] = " ".join(feedback_items[i]["mistakes"])

        attention_count = sum(1 for item in feedback_items if item.get("status") in {"needs_attention", "incorrect", "missing", "extra", "invalid", "insufficient_data"})
        if expected_directions:
            overall_feedback = (
                "Your stroke sequence matches the reference order."
                if reference_mistakes == 0
                else f"Focus on {reference_mistakes} stroke-order issue(s), especially the strokes marked incorrect, missing, or extra."
            )
        elif attention_count == 0:
            overall_feedback = "Your strokes were analyzed successfully. No major stroke-quality issue was detected."
        else:
            overall_feedback = f"{attention_count} stroke(s) need attention. Review the individual feedback and practice those strokes again."

        return jsonify({
            "success": True,
            "status": "analyzed",
            "message": "Stroke-by-stroke mistake feedback generated successfully.",
            "language": language,
            "character": character,
            "stroke_count": len(strokes),
            "has_reference": bool(expected_directions),
            "actual_directions": actual_directions,
            "expected_directions": expected_directions,
            "order_score": order_score,
            "mistake_count": attention_count,
            "reference_order_mistakes": reference_mistakes,
            "missing_strokes": missing_strokes,
            "extra_strokes": extra_strokes,
            "overall_feedback": overall_feedback,
            "stroke_feedback": feedback_items
        })

    except Exception as error:
        traceback.print_exc()
        return jsonify({
            "success": False,
            "status": "error",
            "message": f"Unable to generate stroke feedback: {error}"
        }), 500


@app.route("/stroke-by-stroke-feedback", methods=["GET", "POST"])
def stroke_by_stroke_feedback_alias():
    return stroke_feedback()

if __name__ == "__main__":

    print()
    print("=" * 70)

    print(
        "SCRIPTLY AI HANDWRITING BACKEND"
    )

    print("=" * 70)

    print(
        "Server: https://scripty-backend-zd0r.onrender.com"
    )

    print(
        "Health: https://scripty-backend-zd0r.onrender.com/health"
    )

    print(
        "Languages: https://scripty-backend-zd0r.onrender.com/languages"
    )

    print(
        "Recognition: POST https://scripty-backend-zd0r.onrender.com/recognize"
    )

    print(
        "Compatibility: POST https://scripty-backend-zd0r.onrender.com/predict"
    )

    print("=" * 70)
    print()

    app.run(
        host="127.0.0.1",
        port=5000,
        debug=True
    )