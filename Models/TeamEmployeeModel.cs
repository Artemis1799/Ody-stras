using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;

namespace t5_back.Models;

public class TeamEmployee
{
    [Required]
    public Guid TeamId { get; set; }
    
    [Required]
    public Guid EmployeeId { get; set; }
    
    [ForeignKey("TeamId")]
    [JsonIgnore]
    public Team? Team { get; set; }
    
    [ForeignKey("EmployeeId")]
    [JsonIgnore]
    public Employee? Employee { get; set; }
}
