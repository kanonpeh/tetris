package com.example.demo;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class TetrisController {
    @GetMapping("/tetris")
    public String tetris() {
        return "tetris";
    }
}
