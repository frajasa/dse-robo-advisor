package tz.co.dseroboadvisor.roboadvisor.exception;

import graphql.GraphQLError;
import graphql.schema.DataFetchingEnvironment;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.graphql.data.method.annotation.GraphQlExceptionHandler;
import org.springframework.graphql.execution.ErrorType;
import org.springframework.web.bind.annotation.ControllerAdvice;

@ControllerAdvice
public class GraphQLExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GraphQLExceptionHandler.class);

    @GraphQlExceptionHandler(ResourceNotFoundException.class)
    public GraphQLError handleNotFound(ResourceNotFoundException ex, DataFetchingEnvironment env) {
        logger.warn("Resource not found: {} for operation: {}", ex.getMessage(), env.getField().getName());
        return GraphQLError.newError()
                .errorType(ErrorType.NOT_FOUND)
                .message(ex.getMessage())
                .build();
    }

    @GraphQlExceptionHandler(DuplicateResourceException.class)
    public GraphQLError handleDuplicate(DuplicateResourceException ex, DataFetchingEnvironment env) {
        logger.warn("Duplicate resource: {} for operation: {}", ex.getMessage(), env.getField().getName());
        return GraphQLError.newError()
                .errorType(ErrorType.BAD_REQUEST)
                .message(ex.getMessage())
                .build();
    }

    @GraphQlExceptionHandler(InvalidInputException.class)
    public GraphQLError handleInvalidInput(InvalidInputException ex, DataFetchingEnvironment env) {
        logger.warn("Invalid input: {} for operation: {}", ex.getMessage(), env.getField().getName());
        return GraphQLError.newError()
                .errorType(ErrorType.BAD_REQUEST)
                .message(ex.getMessage())
                .build();
    }

    @GraphQlExceptionHandler(AccessDeniedException.class)
    public GraphQLError handleAccessDenied(AccessDeniedException ex, DataFetchingEnvironment env) {
        logger.warn("Access denied: {} for operation: {}", ex.getMessage(), env.getField().getName());
        return GraphQLError.newError()
                .errorType(ErrorType.FORBIDDEN)
                .message(ex.getMessage())
                .build();
    }

    @GraphQlExceptionHandler(ServiceUnavailableException.class)
    public GraphQLError handleServiceUnavailable(ServiceUnavailableException ex, DataFetchingEnvironment env) {
        logger.error("Service unavailable: {} for operation: {}", ex.getMessage(), env.getField().getName());
        return GraphQLError.newError()
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("Service temporarily unavailable. Please try again later.")
                .build();
    }

    @GraphQlExceptionHandler(Exception.class)
    public GraphQLError handleGeneric(Exception ex, DataFetchingEnvironment env) {
        logger.error("Unexpected error for operation {}: {}", env.getField().getName(), ex.getMessage(), ex);
        return GraphQLError.newError()
                .errorType(ErrorType.INTERNAL_ERROR)
                .message("An unexpected error occurred. Please try again later.")
                .build();
    }
}
