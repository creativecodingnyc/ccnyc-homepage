import type { PosterData } from "./types";
import styles from "./poster-builder.module.css";

type ControlsPanelProps = {
  poster: PosterData;
  onChange: <Key extends keyof PosterData>(
    key: Key,
    value: PosterData[Key],
  ) => void;
};

export default function ControlsPanel({
  poster,
  onChange,
}: ControlsPanelProps) {
  const saveAsPdf = () => {
    const title = document.title;
    document.title = "";
    window.addEventListener(
      "afterprint",
      () => {
        document.title = title;
      },
      { once: true },
    );
    window.print();
  };

  return (
    <details className={styles.controls} aria-label="Poster controls" open>
      <summary className={styles.panelHeading}>
        <h2>Build a Poster</h2>
        <span aria-hidden="true" />
      </summary>

      <details className={styles.section} open>
        <summary>Text</summary>
        <div className={styles.sectionBody}>
          <div className={styles.contentField}>
            <span>Title</span>
            <input
              aria-label="Title content"
              value={poster.title}
              onChange={(event) => onChange("title", event.target.value)}
            />
            <label className={styles.coordinateField}>
              <span>X</span>
              <input
                aria-label="Title X coordinate"
                type="number"
                min="0"
                max="100"
                value={poster.titleX}
                onChange={(event) =>
                  onChange("titleX", Number(event.target.value))
                }
              />
            </label>
            <label className={styles.coordinateField}>
              <span>Y</span>
              <input
                aria-label="Title Y coordinate"
                type="number"
                min="0"
                max="100"
                value={poster.titleY}
                onChange={(event) =>
                  onChange("titleY", Number(event.target.value))
                }
              />
            </label>
          </div>

          <div className={styles.contentField}>
            <span>Date</span>
            <input
              aria-label="Date content"
              value={poster.date}
              onChange={(event) => onChange("date", event.target.value)}
            />
            <input
              aria-label="Date X coordinate"
              type="number"
              min="0"
              max="100"
              value={poster.dateX}
              onChange={(event) =>
                onChange("dateX", Number(event.target.value))
              }
            />
            <input
              aria-label="Date Y coordinate"
              type="number"
              min="0"
              max="100"
              value={poster.dateY}
              onChange={(event) =>
                onChange("dateY", Number(event.target.value))
              }
            />
          </div>

          <div className={styles.contentField}>
            <span>Location</span>
            <input
              aria-label="Location content"
              value={poster.location}
              onChange={(event) => onChange("location", event.target.value)}
            />
            <input
              aria-label="Location X coordinate"
              type="number"
              min="0"
              max="100"
              value={poster.locationX}
              onChange={(event) =>
                onChange("locationX", Number(event.target.value))
              }
            />
            <input
              aria-label="Location Y coordinate"
              type="number"
              min="0"
              max="100"
              value={poster.locationY}
              onChange={(event) =>
                onChange("locationY", Number(event.target.value))
              }
            />
          </div>

          <div className={styles.contentField}>
            <span>Time</span>
            <input
              aria-label="Time content"
              value={poster.time}
              onChange={(event) => onChange("time", event.target.value)}
            />
            <input
              aria-label="Time X coordinate"
              type="number"
              min="0"
              max="100"
              value={poster.timeX}
              onChange={(event) =>
                onChange("timeX", Number(event.target.value))
              }
            />
            <input
              aria-label="Time Y coordinate"
              type="number"
              min="0"
              max="100"
              value={poster.timeY}
              onChange={(event) =>
                onChange("timeY", Number(event.target.value))
              }
            />
          </div>
        </div>
      </details>

      <details className={styles.section} open>
        <summary>Typography</summary>
        <div className={styles.sectionBody}>
          <label className={styles.field}>
            <span>Typeface</span>
            <select
              value={poster.fontFamily}
              onChange={(event) =>
                onChange(
                  "fontFamily",
                  event.target.value as PosterData["fontFamily"],
                )
              }
            >
              <option value="tanker">Tanker</option>
              <option value="karla">Karla</option>
              <option value="mono">IBM Plex Mono</option>
            </select>
          </label>

          <label className={styles.field}>
            <span>Font size</span>
            <input
              type="number"
              min="48"
              max="160"
              value={poster.fontSize}
              onChange={(event) =>
                onChange("fontSize", Number(event.target.value))
              }
            />
          </label>

          <label className={styles.field}>
            <span>Align</span>
            <select
              value={poster.alignment}
              onChange={(event) =>
                onChange(
                  "alignment",
                  event.target.value as PosterData["alignment"],
                )
              }
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </select>
          </label>
        </div>
      </details>

      <details className={styles.section}>
        <summary>Background</summary>
        <div className={styles.sectionBody}>
          <label className={styles.field}>
            <span>Color</span>
            <input
              className={styles.color}
              type="color"
              value={poster.background}
              onChange={(event) => onChange("background", event.target.value)}
            />
          </label>
          <label className={styles.field}>
            <span>Shader</span>
            <select
              value={poster.shader}
              onChange={(event) =>
                onChange("shader", event.target.value as PosterData["shader"])
              }
            >
              <option value="none">None</option>
              <option value="liquid">Liquid</option>
              <option value="rings">Rings</option>
              <option value="scan">Scan lines</option>
            </select>
          </label>
        </div>
      </details>

      <details className={styles.section}>
        <summary>Colors</summary>
        <div className={styles.sectionBody}>
          <label className={styles.field}>
            <span>Text</span>
            <input
              className={styles.color}
              type="color"
              value={poster.fontColor}
              onChange={(event) => onChange("fontColor", event.target.value)}
            />
          </label>
        </div>
      </details>

      <details className={styles.section}>
        <summary>Export</summary>
        <div className={styles.sectionBody}>
          <button className={styles.print} type="button" onClick={saveAsPdf}>
            Save as PDF
          </button>
        </div>
      </details>
    </details>
  );
}
