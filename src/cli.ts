#!/usr/bin/env bun
// src/cli.ts
import { Command } from "commander";
import pc from "picocolors";
import { startServer } from "./server";

const program = new Command();

program
  .name("mockify")
  .description("Geliştiriciler için minimalist ve hızlı Mock API Sunucusu")
  .version("1.0.0");

program
  .command("start")
  .description("Mock sunucusunu başlatır")
  .option("-p, --port <number>", "Sunucunun çalışacağı port", "4000")
  .action((options) => {
    const port = parseInt(options.port, 10);
    console.log(pc.green(`🚀 Mockify hazırlanıyor...`));
    startServer(port);
  });

program.parse(process.argv);