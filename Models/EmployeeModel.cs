using System;
using System.ComponentModel.DataAnnotations;
using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class Employee
{
    [Key]
    public Guid UUID { get; set; }
    
    [Required]
    [MaxLength(255)]
    public string LastName { get; set; } = string.Empty;
    
    [Required]
    [MaxLength(255)]
    public string FirstName { get; set; } = string.Empty;
    
    [MaxLength(60)]
    public string? Email { get; set; }
    
    [MaxLength(50)]
    public string? Phone { get; set; }
    
    [Required]
    public bool IsFavorite { get; set; }
    
    [JsonIgnore]
    public ICollection<TeamEmployee>? TeamEmployees { get; set; }
}
