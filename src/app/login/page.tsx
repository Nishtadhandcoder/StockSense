"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("admin@stocksense.com");
  const [password, setPassword] = useState("password123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError("Invalid email or password");
      setLoading(false);
    } else {
      router.push("/");
    }
  };

  return (
    <div className={styles.loginContainer}>
      <div className={styles.loginBackground}>
        <div className={styles.glowOrb1}></div>
        <div className={styles.glowOrb2}></div>
      </div>
      
      <div className={`glass-card animate-fade-in ${styles.loginCard}`}>
        <div className={styles.header}>
          <div className={styles.logo}>
            <div className={styles.logoIcon}></div>
            <h2>StockSense</h2>
          </div>
          <p>Welcome back! Please enter your details.</p>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.inputGroup}>
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
            />
          </div>

          <div className={styles.inputGroup}>
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          <div className={styles.formFooter}>
            <div className={styles.checkboxGroup}>
              <input type="checkbox" id="remember" />
              <label htmlFor="remember">Remember me</label>
            </div>
            <a href="#" className={styles.forgotLink}>Forgot password?</a>
          </div>

          <button 
            type="submit" 
            className={`btn btn-primary ${styles.submitBtn}`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className={styles.demoAccounts}>
          <p>Demo Accounts:</p>
          <ul>
            <li onClick={() => {setEmail('admin@stocksense.com'); setPassword('password123')}}>Admin: <span>admin@stocksense.com</span></li>
            <li onClick={() => {setEmail('manager@stocksense.com'); setPassword('password123')}}>Manager: <span>manager@stocksense.com</span></li>
            <li onClick={() => {setEmail('staff@stocksense.com'); setPassword('password123')}}>Staff: <span>staff@stocksense.com</span></li>
          </ul>
        </div>
      </div>
    </div>
  );
}
