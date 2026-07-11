# Введение


# Устойчивые выражения
| RUS | ENG |
|:---:|:---:|
| Мобильное устройство (МУ) | Mobile device (MD) |
| Базовая станция (БС) | Base station (BS) |

# Структура проекта
```text 
paws-tracker/               
├── hardware/              # Аппаратная часть (прошивки и 3д модели)
│   ├── base_station/      # Базовая станция
│   │   ├── electronics/
│   │   ├── firmware/
│   │   ├── models/
│   │
│   └── mobile_device/     # Мобильное устройство
│       ├── electronics/
│       ├── firmware/
│       └── models/
│
└── web_server/            # Серверная часть (веб-интерфейс и API)
```