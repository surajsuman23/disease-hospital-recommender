import type { Hospital } from '../../../../packages/contracts/src';
export function HospitalCards({ hospitals }: { hospitals: Hospital[] }) {
  return (
    <div className="hospital-grid">
      {hospitals.map((h, i) => (
        <article className="hospital-card" key={h.id}>
          <div className="hospital-card-top">
            <span className="hospital-code">
              BLR / {String(i + 1).padStart(2, '0')}
            </span>
            <span className="pill">{h.area}</span>
          </div>
          <h3>{h.name}</h3>
          <p className="hospital-address">{h.address}</p>
          <div className="hospital-distance">
            {h.distanceKm !== undefined ? (
              <>
                <strong>
                  {h.distanceKm.toFixed(2)} <small>km</small>
                </strong>
                <span>
                  Straight-line distance from your assessment coordinates
                </span>
              </>
            ) : (
              <span>
                Public hospital listing
                <br />
                Bengaluru, Karnataka
              </span>
            )}
          </div>
          <div className="hospital-links">
            <a href={h.website} target="_blank" rel="noreferrer">
              Official listing ↗
            </a>
            <a href={h.mapUrl} target="_blank" rel="noreferrer">
              Open map ↗
            </a>
          </div>
          <small className="source-caption">
            Location: OpenStreetMap · Checked {h.verifiedOn}
          </small>
        </article>
      ))}
    </div>
  );
}
