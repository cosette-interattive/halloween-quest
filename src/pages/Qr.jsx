import { QRCodeSVG } from 'qrcode.react';
import BackButton from '../components/BackButton.jsx';

export default function Qr() {
  const url = `${window.location.origin}${import.meta.env.BASE_URL}#/`;

  return (
    <div className="app center">
      <BackButton />
      <h1>Entra in Halloween Quest</h1>
      <div style={{ background: '#fff', padding: 16, borderRadius: 16 }}>
        <QRCodeSVG value={url} size={240} />
      </div>
      <p className="muted">{url}</p>
    </div>
  );
}
