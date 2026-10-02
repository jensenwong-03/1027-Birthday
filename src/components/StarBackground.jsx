import "../styles/StarBackground.css";

function StarBackground({ warp = false }) {

  const stars = Array.from({ length: 160 });

  return (
    <div className={`stars ${warp ? "warp" : ""}`}>

      {stars.map((_, index) => {

        const size = Math.random() * 3 + 1;

        const style = {

          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,

          width: `${size}px`,
          height: `${size}px`,

          animationDelay: `${Math.random() * 6}s`,

          animationDuration: `${3 + Math.random() * 4}s`

        };

        return (

          <span

            key={index}

            className="star"

            style={style}

          />

        );

      })}

    </div>
  );

}

export default StarBackground;