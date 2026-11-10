import './brand-logo.css';

/** Display the supplied artwork, framing out its original outer whitespace. */
export function BrandLogo({wordmark=false,decorative=false}:{wordmark?:boolean;decorative?:boolean}) {
 return <span className={`brand-logo ${wordmark?'brand-logo-wordmark':'brand-logo-icon'}`}><img src={`/brand/finweave-${wordmark?'wordmark':'icon'}.png`} alt={decorative?'':'FinWeave'} draggable={false}/></span>;
}
