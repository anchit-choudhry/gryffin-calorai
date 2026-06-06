package com.gryffin.calorai.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/** MVC view controller configuration. */
@Configuration
public class WebConfig implements WebMvcConfigurer {

  @Override
  public void addViewControllers(final ViewControllerRegistry registry) {
    registry.addRedirectViewController("/", "/swagger-ui/index.html");
    registry.addRedirectViewController("/swagger-ui", "/swagger-ui/index.html");
  }
}
