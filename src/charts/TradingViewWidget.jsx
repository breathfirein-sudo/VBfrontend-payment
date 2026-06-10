import React, { useEffect, useRef } from 'react';

const TradingViewWidget = ({ symbol = "NASDAQ:TSLA", theme = "light", interval = "240" }) => {
  const container = useRef(null);

  useEffect(() => {
    // Clear container
    if (container.current) {
      container.current.innerHTML = '';
    }

    const script = document.createElement("script");
    script.src = "https://s3.tradingview.com/tv.js";
    script.type = "text/javascript";
    script.async = true;
    script.onload = () => {
      if (typeof window.TradingView !== 'undefined' && container.current) {
        new window.TradingView.widget({
          "autosize": true,
          "symbol": symbol,
          "interval": interval,
          "timezone": "Etc/UTC",
          "theme": theme,
          "style": "1",
          "locale": "en",
          "enable_publishing": false,
          "allow_symbol_change": true,
          "container_id": container.current.id,
          "hide_side_toolbar": false,
          "save_image": false
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [symbol, theme]);

  return (
    <div className="tradingview-widget-container" style={{ height: '400px', width: '100%' }}>
      <div id={`tradingview_${Math.random().toString(36).substring(7)}`} ref={container} style={{ height: '100%', width: '100%' }} />
    </div>
  );
};

export default TradingViewWidget;
