import { useState } from "react";
import "../styles/PasswordGate.css";

const CORRECT_PASSWORD = "041027";

function PasswordGate({ onSuccess }) {

  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);
  const [verified, setVerified] = useState(false);


  function handleSubmit(e) {

    e.preventDefault();

    if (checking || verified) return;

    setError(false);
    setChecking(true);


    /* =========================================
       Password Verification
       ========================================= */

    if (password === CORRECT_PASSWORD) {

      // 模拟系统验证
      setTimeout(() => {

        setChecking(false);
        setVerified(true);

      }, 900);


      // 验证成功后停留一下再进入系统
      setTimeout(() => {

        onSuccess();

      }, 2400);


    } else {

      setTimeout(() => {

        setError(true);
        setChecking(false);
        setPassword("");

      }, 600);

    }

  }


  return (

    <div
      className={`password-gate ${
        error ? "password-error" : ""
      }`}
    >

      {/* =========================================
          Background Stars
          ========================================= */}

      <div className="password-stars">

        {Array.from({
          length: 90
        }).map((_, index) => {

          const size =
            Math.random() * 2 + 1;

          return (

            <span
              key={index}
              className="password-star"
              style={{
                left:
                  `${Math.random() * 100}%`,
                top:
                  `${Math.random() * 100}%`,
                width:
                  `${size}px`,
                height:
                  `${size}px`,
                animationDelay:
                  `${Math.random() * 4}s`
              }}
            />

          );

        })}

      </div>


      {/* =========================================
          Password Panel
          ========================================= */}

      <div className="password-panel">

        <p className="password-system">
          BIRTHDAY SYSTEM
        </p>

        <div className="password-line"></div>


        <p className="password-code">
          • • • • • •
        </p>


        <h1>
          生日副本
        </h1>


        <p className="password-subtitle">
          检测到受保护的生日资料
        </p>


        <div className="password-divider"></div>


        {/* =========================================
            Status
            ========================================= */}

        {!verified ? (

          <>

            <p className="password-hint">
              {checking
                ? "正在验证访问权限……"
                : "请输入访问密码"}
            </p>


            {!checking && (

              <form
                className="password-form"
                onSubmit={handleSubmit}
              >

                <input
                  type="password"
                  value={password}
                  onChange={(e) => {

                    setPassword(e.target.value);
                    setError(false);

                  }}
                  placeholder="ACCESS CODE"
                  autoFocus
                  autoComplete="off"
                  disabled={checking}
                />


                <button
                  type="submit"
                  disabled={
                    password.length === 0
                  }
                >

                  进入副本

                </button>

              </form>

            )}


            {checking && (

              <div className="password-checking">

                <span className="checking-spinner">
                  ◌
                </span>

                <span>
                  VERIFYING...
                </span>

              </div>

            )}


            <div
              className={`password-status ${
                error
                  ? "status-error"
                  : ""
              }`}
            >

              {error
                ? "访问权限拒绝 · 密码错误"
                : checking
                  ? "正在确认生日资料……"
                  : "仅限指定对象访问"}

            </div>

          </>

        ) : (

          /* =========================================
             Verification Success
             ========================================= */

          <div className="password-success">

            <div className="success-icon">
              ✓
            </div>

            <p className="success-title">
              验证成功
            </p>

            <p className="success-subtitle">
              访问权限已确认
            </p>

            <div className="success-loading">

              <span></span>
              <span></span>
              <span></span>

            </div>

            <p className="success-message">
              正在进入生日副本……
            </p>

          </div>

        )}


        <p className="password-footer">
          SYSTEM 1027 · CLASSIFIED
        </p>

      </div>

    </div>

  );

}

export default PasswordGate;