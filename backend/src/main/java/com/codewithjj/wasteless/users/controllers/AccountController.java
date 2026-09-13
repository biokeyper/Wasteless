package com.codewithjj.wasteless.users.controllers;

import com.codewithjj.wasteless.auth.CurrentUser;
import com.codewithjj.wasteless.users.dtos.AccountExport;
import com.codewithjj.wasteless.users.services.AccountService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("account")
@Tag(name = "Account", description = "The signed-in user's own data")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("export")
    @Operation(summary = "Download everything the account holds")
    public AccountExport export(@AuthenticationPrincipal Jwt jwt) {
        return accountService.export(CurrentUser.id(jwt));
    }

    @DeleteMapping
    @Operation(summary = "Delete the account", description = "Removes the user, their items and their requests")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal Jwt jwt) {
        accountService.delete(CurrentUser.id(jwt));
        return ResponseEntity.noContent().build();
    }
}
